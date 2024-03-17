const canvas = document.getElementById('mainCanvas');
const context = canvas.getContext('2d');

// constantar til að auðvelda læsileika í lyklaborðsföllum
const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_S = 83;
const KEY_E = 69;
const KEY_G = 71;

// timer breyta sem telur upp um 1 fyrir hverjar 10 millisekúndur
let runtimeMilliseconds = 0;

// breyta sem geymir runtimeMilliseconds gildið á seinasta lyklaborðsinputi
// (til að koma í veg fyrir að það triggerist of oft)
// TODO: finna góðan meðalveg til að geta notað þetta á alla takkana?
let lastKeypress = 0;

// fjöldi stjarna á bakgrunnsmynd
const NUM_STARS = 500;

// skölunarbreyta fyrir öll form/hluti
const grid = 10;

// constantar fyrir leikmann
const playerStartX = context.canvas.width/2;
const playerStartY = context.canvas.height/2;
const playerSpeed = 0.3;
const playerMaxSpeed = 6;
const playerRotationSpeed = 7;
const playerStartLives = 4;
const playerDrag = 0.025;

// tímabreytur til að hindra það að fleiri en 1 skot skjótist í einu
let playerLastShotTime = 0;
const playerMinTimeBetweenShots = 20;// x*10 millisekúndur, 100 er þá == 1 sek.

// constantar fyrir kúlur
const maxBullets = 10;
const bulletSpeed = 7;
const bulletMaxAge = 150;

// object sem geymir upplýsingar um það hvaða takka er verið að ýta á
let keys = {
    KEY_LEFT: false,
    KEY_RIGHT: false,
    KEY_UP: false,
    KEY_DOWN: false,
    KEY_SPACE: false,
    KEY_S: false,
    KEY_E: false,
    KEY_G: false
};

// fylki til að geyma hlutina sem eru til staðar í leiknum
let asteroids = [];
let saucers = [];
let bullets = [];
let players = []; // sett í fylki til að auka læsileika, mætti kannski nýta í 2 player mode?

let generatedBackground = false;
let storedBackground;

//default stillingar á canvas teikningunum
context.strokeStyle = "white";
context.fillStyle = "black";
context.lineWidth = 1;

//atburðahlustarar
document.addEventListener("keydown",keydown);
document.addEventListener("keyup",keyup);
addEventListener("load",initStuff);

// virkja timer til að geta tímasett hluti
let timer = setInterval(incrementTimer,10);

//tmp fikt
const doClassicShapes = false;

let audioShoot = new Audio();
let audioThrust = new Audio();

// initStuff()
// stilla það sem þarf að stilla í upphafi
function initStuff()
{
    audioShoot.src = "sounds/shoot.wav";
    audioThrust.src = "sounds/thrust.wav";
    audioThrust.loop = true;

    players.push(new Player(playerStartX,playerStartY));

    //fyrsta kallið á aðallykkjufallið, það kallar svo sjálft aftur á sig
    window.requestAnimationFrame(update);
}

// update()
// fall sem hýsir aðallykkju leiksins
function update()
{
    //
    // input höndlun fyrst
    //
    handleKeys();

    //
    // síðan hreyfingar og snúningar
    //
    move_polygons(players);
    move_polygons(asteroids);
    move_polygons(saucers);
    move_polygons(bullets);

    rotate_polygons(asteroids);

    //
    // fjarlægja útrunnar kúlur
    //
    decay_bullets();

    //
    //skoða árekstra
    //
    check_collisions(players,players);
    check_collisions(players,asteroids);//virkar
    check_collisions(players,saucers);//virkar
    check_collisions(players,bullets);//virkar

    //check_collisions(bullets,bullets);// virkar sennilega, en erfitt að testa og nánast ómögulegt að gerist
    check_collisions(bullets,asteroids);//virkar
    check_collisions(bullets,saucers);//virkar

    //check_collisions(asteroids,asteroids);//virkar
    //check_collisions(asteroids,saucers);//virkar

    //check_collisions(saucers,saucers);//virkar

    //
    // Hreinsa til eftir árekstra
    //
    cleanup_polygons(asteroids);
    cleanup_polygons(saucers);
    //cleanup_polygons(bullets);

    //
    //og að lokum teikna allt sem þarf
    //
    draw_background();

    draw_polygons(asteroids);
    draw_polygons(saucers);
    draw_polygons(bullets);
    draw_polygons(players);

    drawGUI();

    //
    // kalla svo aftur á update() til að framkvæma næstu lykkju
    //
    window.requestAnimationFrame(update);
}

// check_collisions()
// fer í gegnum 2 fylki og keyrir árekstraprófun á þeim
//
// first -> fyrra fylkið af Polygon klösum, check_collision() er keyrt úr þessu fylki
// second -> seinna fylkið af Polygon klösum, gefið sem færibreyta í check_collision() kallinu
function check_collisions(first,second)
{
    if(first.length > 0)
    {
        if(second.length > 0)
        {
            for(let i = 0; i < first.length;i++)
            {
                for(let j = 0; j < second.length;j++)
                {
                    first[i].check_collision(second[j]);
                }
            }
        }
    }
}

// cleanup_array()
// fer í gegnum fylki af Polygon klösum og eyðir stökum sem eru merkt ónýt
//
// array -> fylki af Polygon klösum
function cleanup_polygons(array)
{
    if(array.length > 0)
    {
        for(let i = 0; i < array.length; i++)
        {
            if(array[i].m_destroyed == true)
            {
                array.splice(i,1);
            }
        }
    }
}

// decay_bullets()
// fall sem fer í gegnum fylkið af kúlum og fjarlægir þær sem eru útrunnar
// m_decayed er stillt í move() fallinu í Bullet klasanum þannig að þetta
// fall þarf að keyrast eftir að move() hefur keyrt
function decay_bullets()
{
    //fara í gegnum kúlurnar
    if(bullets.length > 0)
    {
        for(let i = 0; i < bullets.length; i++)
        {
            // fjarlægja kúluna ef hún er orðin of gömul
            if(bullets[i].m_decayed == true)
            {
                bullets.splice(i,1);
            }
        }
    }
}

// move_polygons()
// fall sem fer í gegnum fylki af Polygon klösum og keyrir move() fallið þeirra
//
// array -> fylki af Polygon klösum
function move_polygons(array)
{
    if(array.length > 0)
    {
        for(let i = 0; i < array.length;i++)
        {
            array[i].move();
        }
    }
}

// rotate_polygons()
// fall sem fer í gegnum fylki af Polygon klösum og keyrir rotate() fallið þeirra
//
// array -> fylki af Polygon klösum
function rotate_polygons(array)
{
    if(array.length > 0)
    {
        for(let i = 0; i < array.length;i++)
        {
            array[i].rotate();
        }
    }
}

// draw_polygons()
// fall sem fer í gegnum fylki af Polygon klösum og keyrir draw() fallið þeirra
//
// array -> fylki af Polygon klösum
function draw_polygons(array)
{
    if(array.length > 0)
    {
        for(let i = 0; i < array.length;i++)
        {
            array[i].draw();
        }
    }
}

// randomCoordinates()
// býr til random pixel position skjáhnit
function randomCoordinates()
{
    let X = Math.floor(Math.random()*(context.canvas.width-1));
    let Y = Math.floor(Math.random()*(context.canvas.height-1));
    return [X,Y];
}

// drawGUI()
// teiknar notendaviðmótið
function drawGUI()
{
    drawScore();
    drawLives();
}

// drawScore()
// teiknar stigin sem leikmaður er kominn með
function drawScore()
{
    drawText(players[0].getScore().toString(),5,35);
}

// drawLives()
// teiknar lífin sem leikmaður á eftir
function drawLives()
{
    if(players[0].getLives() > 0)
    {
        let tmpShip = new Ship(0,60);
        for(let i = 0; i < players[0].getLives(); i++)
        {
            tmpShip.m_posX = (i*2.5*grid)+20;
            tmpShip.draw();
        }
    }
}

// handleKeys()
// bregst við eftir því sem við á ef takki á lyklaborði er niðri/uppi
function handleKeys()
{
    let tmpCoords;
    let timeSinceLast = runtimeMilliseconds-lastKeypress;

    if(keys[KEY_LEFT] == true)
    {
        players[0].rotate(-players[0].m_rotationSpeed);
    }

    if(keys[KEY_RIGHT] == true)
    {
        players[0].rotate(players[0].m_rotationSpeed);
    }

    if(keys[KEY_UP] == true)
    {
        players[0].thrust();
        //audioThrust.play();
    }
    else
    {
        players[0].thrust(0);
        //audioThrust.pause();
    }

    if(keys[KEY_SPACE] == true && ((runtimeMilliseconds-playerLastShotTime) >= playerMinTimeBetweenShots))
    {
        playerLastShotTime = runtimeMilliseconds;

        players[0].shoot();

        audioShoot.currentTime = 0;
        audioShoot.play();
    }

    // smá bremsa á lyklaborðsinput sem eru höndluð neðar í fallinu
    if(timeSinceLast <= 5) {
        return;
    } else {
        lastKeypress = runtimeMilliseconds;
    }

    if(keys[KEY_S] == true) // prufa, býr til random asteroid
    {
        tmpCoords = randomCoordinates();
        asteroids.push(new Asteroid(tmpCoords[0],tmpCoords[1]));
    }

    if(keys[KEY_E] == true) // prufa, býr til random óvini
    {
        tmpCoords = randomCoordinates();
        if(Math.floor(Math.random() * 50) > 25)
        {
            saucers.push(new BigEnemy(tmpCoords[0],tmpCoords[1]));
        }
        else
        {
            saucers.push(new SmallEnemy(tmpCoords[0],tmpCoords[1]));
        }
    }

    if(keys[KEY_G] == true) // hyperspace
    {
        tmpCoords = randomCoordinates();
        players[0].m_posX = tmpCoords[0];
        players[0].m_posY = tmpCoords[1];

        let randomNumber = Math.floor(Math.random()*62);
        if(randomNumber >= (asteroids.length+44))
        {
            players[0].die();
        }
    }
}

// draw_background()
// teiknar bakgrunn með NUM_STARS random pixlum
// fallið teiknar bakgrunninn einu sinni og geymir hann
// eftir það, þá teiknar fallið geymda bakgrunninn
function draw_background()
{
    // ef enginn bakgrunnur er til í geymslu:
    if(!generatedBackground)
    {
        //hreinsa skjáinn með því að teikna kassa
        context.clearRect(0,0,context.canvas.width,context.canvas.height);
        context.beginPath();
        context.rect(0,0,context.canvas.width,context.canvas.height);
        context.fill();

        // búa til random stjörnur
        for(let i = 0; i < NUM_STARS;i++)
        {
            let sX = Math.floor(Math.random()*(context.canvas.width-1));
            let sY = Math.floor(Math.random()*(context.canvas.height-1));
            context.fillStyle = "white";
            context.fillRect(sX,sY,1,1);
        }
        context.fillStyle = "black";

        // geyma bakgrunn
        storedBackground = canvas.toDataURL();

        generatedBackground = true;
    }
    else // ef bakgrunnur var til í geymslu:
    {
        let tmpImg = new Image();

        // sækja bakgrunn og teikna hann á skjáinn
        tmpImg.src = storedBackground;
        context.drawImage(tmpImg,0,0);
    }
}

// keydown()
// atburðahöndlari fyrir keydown atburði
// "skrifar" hjá sér takka sem er ýtt niður
function keydown(event)
{
    if(event.keyCode == KEY_LEFT || event.keyCode == KEY_RIGHT ||
       event.keyCode == KEY_UP   || event.keyCode == KEY_SPACE ||
       event.keyCode == KEY_S    || event.keyCode == KEY_E     ||
       event.keyCode == KEY_G)
    {
        keys[event.keyCode] = true;
    }
}

// keyup()
// atburðahöndlari fyrir keyup atburði
// "skrifar" hjá sér takka sem er sleppt
function keyup(event)
{
    if(event.keyCode == KEY_LEFT || event.keyCode == KEY_RIGHT ||
       event.keyCode == KEY_UP   || event.keyCode == KEY_SPACE ||
       event.keyCode == KEY_S    || event.keyCode == KEY_E     ||
       event.keyCode == KEY_G)
    {
        keys[event.keyCode] = false;
    }
}

// randomShape()
// fall sem býr til handahófskennt form
// það fer í hring og býr til punkta
//
// nodes -> fjöldi punkta á hringnum
//  minR -> lægsti mögulegi radíus
//  maxR -> hæsti mögulegi radíus
//
// skilar frá sér fylki af fylkjum með X,Y hnitum
// t.d. [[x,y],[x2,y2],[x3,y3]]
// (ekki pixel position hnitum, þau eru seinna sköluð upp með grid breytunni)
function randomShape(nodes,minR,maxR)
{
    // reikna hornið milli punkta út frá fjölda
    let angleStep = (Math.PI * 2) / nodes;

    let tmpRet = [];
    let x, y;

    for(let i = 0;i < nodes;i++)
    {
        // lykkja sem býr til ný hnit
        // keyrir aftur og aftur þangað til það verða til hnit sem eru ekki í fylkinu
        do
        {
            let targetAngle = angleStep * i;
            let angle = targetAngle + (Math.random() - 0.75) * angleStep * 0.5;
            let radius = minR + Math.random() * (maxR-minR);
            x = Math.round(Math.round((Math.cos(angle) * radius) * grid)/grid);
            y = Math.round(Math.round((Math.sin(angle) * radius) * grid)/grid);
        }
        while(isXYInArray(x,y,tmpRet));

        tmpRet.push([x,y]);
    }

    return tmpRet;
}

// isXYInArray()
// athugar hvort hnit séu þegar til staðar í fylki
//
// tx, ty -> hnit
// tmpRet -> fylki
function isXYInArray(tx,ty,tmpRet)
{
    if(tmpRet.length == 0)
        return false;

    for(let j = 0; j < tmpRet.length;j++)
    {
        if(tmpRet[j][0] == tx && tmpRet[j][1] == ty)
        {
            return true;
        }
    }

    return false;
}

// degToRad()
// breytir gráðum í radíana
//
// a -> gráður
function degToRad(a)
{
    return a * (Math.PI/180);
}

// rotate()
// snýr XY hnitum um eitthvað horn
// 
// [X,Y] -> fylki með hnitunum
// angle -> hornið í gráðum
function rotate([X,Y],angle)
{
    let nX = X*Math.cos(degToRad(angle))-Y*Math.sin(degToRad(angle));
    let nY = X*Math.sin(degToRad(angle))+Y*Math.cos(degToRad(angle));
    return [nX,nY];
}

// Polygon
// grunnclass fyrir form
//
// meðlimabreytur:
//   m_scale -> skali á forminu, hægt að nota til að stækka eða minnka formið án þess að þurfa að fikta í hnitunum
//   m_posX -> pixel position staðsetning á X núllpunkti formsins
//   m_posY -> pixel position staðsetning á Y núllpunkti formsins
//   m_thrust -> hröðun formins
//   m_velX -> hraði formsins á X-ás
//   m_velY -> hraði formsins á Y-ás
//   m_maxVel -> hæsti mögulegi hraði formsins á hvorum ás fyrir sig
//   m_angle -> horn í gráðum sem er notað til að teikna formið
//   m_movementAngle -> horn í gráðum sem er notað til að hreyfa formið
//   m_movementSpeed -> default hröðun formsins
//   m_rotationSpeed -> snúningshraði, hversu hratt m_angle breytist
//   m_points -> fylki af punktum sem er notað til að teikna/mynda formið
//   m_destroyed -> er formið ónýtt eftir árekstur?
//   m_pointValue -> stigafjöldi sem leikmaður fær við að eyða þessu formi
//
class Polygon
{
    constructor()
    {
        this.m_scale = 1;

        this.m_posX = 0;
        this.m_posY = 0;

        this.m_thrust = 0;
        this.m_velX = 0;
        this.m_velY = 0;

        this.m_maxVel = 8;

        this.m_angle = 0;
        this.m_movementAngle = 0;

        this.m_movementSpeed = 5;
        this.m_rotationSpeed = 10;

        this.m_destroyed = false;
        this.m_pointValue = 0;

        this.m_points = [];
    }

    // meðlimafall sem umreiknar m_points hnit yfir í pixel position hnit
    // snýr, skalar upp um grid, skalar upp/niður um m_scale og færir svo til á réttan stað
    screen_coordinates(points)
    {
        let tmpPoints = [...points];

        for(let i = 0; i < tmpPoints.length; i++)
        {
            // snúa hnitunum um m_angle
            tmpPoints[i] = rotate(tmpPoints[i],this.m_angle);
            // "ytri" skölun á forminu (grid)
            tmpPoints[i] = [tmpPoints[i][0]*grid,tmpPoints[i][1]*grid];
            // "innri" skölun á forminu (m_scale)
            tmpPoints[i] = [Math.round(tmpPoints[i][0]*this.m_scale),Math.round(tmpPoints[i][1]*this.m_scale)];
            // translation yfir á réttan stað á skjánum (pixel position)
            tmpPoints[i] = [tmpPoints[i][0]+this.m_posX,tmpPoints[i][1]+this.m_posY];
        }

        return tmpPoints;
    }

    // meðlimafall sem tekur við fylki af hnitum og teiknar línur á milli þeirra
    // endar á því að tengja seinasta punkt við upphafspunkt
    // hver undirclass keyrir þetta fall og gefur því fylki
    draw(pointsArray)
    {
        // afrit tekið vegna þess að við munum breyta hnitunum talsvert mikið til að teikna þau
        let points = this.screen_coordinates(pointsArray);

        // teikna formið, línu fyrir línu
        context.beginPath();
        context.moveTo(points[0][0],points[0][1]);
        for(let j = 1; j < points.length; j++)
        {
            context.lineTo(points[j][0],points[j][1]);
        }
        context.lineTo(points[0][0],points[0][1]);
        // fylla formið svo stjörnurnar komi ekki í gegn
        context.fill();
        context.stroke();
    }

    // meðlimafall sem snýr forminu, keyrt í aðallykkju
    rotate(rotationSpeed = this.m_rotationSpeed)
    {
        this.m_angle += rotationSpeed;

        if(this.m_angle < 0)
        {
            this.m_angle += 360;
        }
        else if(this.m_angle >= 360)
        {
            this.m_angle -= 360;
        }
    }

    //meðlimafall sem hreyfir formið út frá m_thrust
    move()
    {
        // geyma gamla stefnuhorn
        let tmpAngle = this.m_movementAngle;
        let didChange = false;

        // þessi if block snýst um að hægja á hreyfingunni
        // eins og er, þá gerist það bara hjá player
        if(this instanceof Player)
        {
            // sækja stefnuhorn á hraðanum
            let velAngle = this.getVelocityAngle();

            // við viljum bara eiga við hreyfinguna ef það er einhver hreyfing að eiga sér stað
            if(this.m_velX != 0 || this.m_velY != 0)
            {
                // og líka bara ef það er ekki verið að gefa inn
                if(this.m_thrust == 0)
                {
                    // snúa hreyfingarhorninu í 180 gráður frá stefnu hraðavigursins
                    this.m_movementAngle = velAngle + 180;

                    // passa að hornið sé á fyrsta hring
                    if(this.m_movementAngle >= 360)
                        this.m_movementAngle -= 360;

                    // setja inn hröðun
                    this.m_thrust = playerDrag;

                    // halda utanum það að hröðuninni og stefnuhorninu var breytt
                    didChange = true;
                }
            }
        }

        // reikna hraðabreytinguna á ásunum
        let a = this.m_thrust * Math.cos(degToRad(this.m_movementAngle));
        let b = this.m_thrust * Math.sin(degToRad(this.m_movementAngle));

        // reikna nýja hraðavigurinn
        let tmpVelX = this.m_velX + b;
        let tmpVelY = this.m_velY - a;

        // passa að lengd hraðavigursins fari ekki of langt yfir hámark
        if(Math.sqrt((tmpVelX*tmpVelX)+(tmpVelY*tmpVelY)) < this.m_maxVel)
        {
            // breyta hraðanum með viðeigandi hraðabreytingu
            this.m_velX += b;
            this.m_velY -= a;
        }

        // námunda hraðavigurinn að núlli ef hann er nógu nálægt því
        // (til að það sé hægt að stoppa alveg)
        // 1e-2 virðist virka ágætlega
        if(Math.abs(this.m_velX) <= 1e-2)
        {
            this.m_velX = 0;
        }
        if(Math.abs(this.m_velY) <= 1e-2)
        {
            this.m_velY = 0;
        }

        // færa staðsetninguna eftir hraðanum
        this.m_posX += this.m_velX;
        this.m_posY += this.m_velY;

        // næstu 4 if skipanir tengja saman endana á skjánum svo að
        // formið birtist á hinum endanum ef það fer út af skjánum
        if(this.m_posY < 0)
        {
            this.m_posY += context.canvas.height;
        }
            
        if(this.m_posY > context.canvas.height)
        {
            this.m_posY -= context.canvas.height;
        }
            
        if(this.m_posX < 0)
        {
            this.m_posX += context.canvas.width;
        }
            
        if(this.m_posX > context.canvas.width)
        {
            this.m_posX -= context.canvas.width;
        }

        // lagfæring á hröðun og stefnuhorni ef því var breytt fremst í fallinu
        if(this instanceof Player)
        {
            if(didChange)
            {
                this.m_thrust = 0;
                this.m_movementAngle = tmpAngle;
            }
        }
    }

    // fall sem reiknar út og skilar stefnuhorni núverandi hraðavigurs
    // útkoman er umreiknuð til að passa við m_angle (sem er snúinn um 90 gráður)
    getVelocityAngle()
    {
        // finna núverandi stefnu á hraðavigri
        let velAngle = Math.atan2(this.m_velY,this.m_velX) * (180/Math.PI);

        // leiðrétta stefnuna aðeins til vegna þess hvernig skipið er teiknað
        if(velAngle != 0)
        {
            velAngle += 90;
        }

        // umbreyta neikvæðum hornum í jákvæð horn
        if(velAngle < 0)
        {
            velAngle += 360;
        }

        return velAngle;
    }
}

// Bullet
// class fyrir kúlur sem er skotið
//
// erfir allt sem Polygon hefur
//
// meðlimabreytur sem bætast við:
//   m_decayed -> segir til um hvort kúlan er útrunnin
//   m_birth -> fæðingartími kúlunnar, notað til að reikna hvort hún sé útrunnin
//   m_playerBullet -> segir til um það hvort kúlunni var skotið af leikmanni eða ekki
//
class Bullet extends Polygon
{
    constructor(posX, posY, velX, velY, playerBullet)
    {
        super();

        this.m_posX = posX;
        this.m_posY = posY;

        this.m_velX = velX;
        this.m_velY = velY;

        this.m_movementAngle = 0;
        this.m_angle = 0;

        this.m_decayed = false;
        this.m_birth = runtimeMilliseconds;

        this.m_playerBullet = playerBullet;
    }

    // fall sem hreyfir kúluna eða merkir hana sem útrunna
    move()
    {
        let age = runtimeMilliseconds - this.m_birth;
        if(age <= bulletMaxAge)
        {
            super.move();
        }
        else
        {
            this.m_decayed = true;
        }
    }

    // sér teiknifall fyrir þennan klasa
    // ólíkt hinum klösunum, þá notar þessi ekki m_points heldur teiknar hring á m_posX,m_posY
    draw()
    {
        context.save();
        context.fillStyle = "white";
        context.beginPath();
        context.arc(this.m_posX, this.m_posY, 2, 0, 2*Math.PI);
        context.fill();
        context.restore();
    }

    // fall til að athuga hvort kúlan hafi rekist á eitthvað
    check_collision(objectToCheck)
    {
        // sleppa því að athuga hvort hún hafi rekist á sjálfa sig
        if(objectToCheck === this)
        {
            return;
        }

        let collision = false;

        // athuga bullet->bullet árekstra
        if(objectToCheck instanceof Bullet)
        {
            collision = collision_point_to_point(this.m_posX,this.m_posY,objectToCheck.m_posX,objectToCheck.m_posY);
        }
        else//athuga bullet->asteroid og bullet->saucer árekstra
        {
            collision = collision_polygon_to_point(objectToCheck.screen_coordinates(objectToCheck.m_points),this.m_posX,this.m_posY);
        }

        if(collision == true)
        {
            // keyra viðeigandi fall til að bregðast við árekstri
            objectToCheck.collided(this);

            // og merkja þessa kúlu sem ónýta
            this.m_destroyed = true;
        }
    }
}

// Ship
// class fyrir skipið sem leikmaðurinn stýrir
//
// erfir allt sem Polygon hefur
//
// meðlimabreyta sem bætist við:
//   m_drawFlame -> teiknar "eldinn" ef það er true
class Ship extends Polygon
{
    constructor(startX, startY)
    {
        super();

        this.m_posX = startX;
        this.m_posY = startY;

        this.m_drawFlame = false;

        if(doClassicShapes)
        {
            this.m_points = [...classicShipShape];
        }
        else
        {
            this.m_points = [...newShipShape];
        }
    }

    rotate(rotationSpeed)
    {
        // kalla fyrst í Polygon.rotate()
        super.rotate(rotationSpeed);

        // læsa svo hreyfingarhorni og teiknihorni saman
        this.m_movementAngle = this.m_angle;
    }

    draw()
    {
        let i = 4;
        if(doClassicShapes)
        {
            i = 5;
        }

        // teikna fyrst skipið
        super.draw(this.m_points.slice(0,i));

        // og svo eldinn ef það á við
        if(this.m_drawFlame)
        {
            //context.save();
            //context.fillStyle = "yellow";
            super.draw(this.m_points.slice(i));
            //context.restore();
        }
    }
}

// Player
// classi til að halda utan um leikmanninn
//
// erfir allt frá Ship sem erfir allt frá Polygon
//
// meðlimabreytur sem bætast við:
//   m_playerLives -> aukalíf sem leikmaður á eftir
//   m_playerScore -> stig sem leikmaður er kominn með
//   m_playerAlive -> boolean fyrir það hvort leikmaður sé á lífi - hægt að sleppa og nota m_playerLives
//
// meðlimaföll sem bætast við:
//      thrust() -> virkjar hröðun
//     isAlive() -> true/false eftir því hvort leikmaður er á lífi
//         die() -> myrðir leikmann í köldu blóði
//   giveScore() -> gefur leikmanni stig
//    getScore() -> skilar út stigafjölda leikmanns
//    getLives() -> skilar út aukalífum sem leikmaður á
//    giveLife() -> gefur leikmanni aukalíf
//   
class Player extends Ship
{
    constructor(X,Y)
    {
        super(X,Y);

        this.m_movementSpeed = playerSpeed;
        this.m_rotationSpeed = playerRotationSpeed;
        this.m_maxVel = playerMaxSpeed;
        this.m_playerLives = playerStartLives;

        this.m_playerScore = 0;
        this.m_playerAlive = true;
    }

    //meðlimafall sem stillir hröðun formsins
    //notað til að stoppa líka með .thrust(0)
    thrust(power = this.m_movementSpeed)
    {
        if(power == 0)
        {
            this.m_drawFlame = false;
        }
        else
        {
            this.m_drawFlame = true;
        }

        this.m_thrust = power;
    }

    // fall sem bregst við árekstrum
    // TODO
    collided(collidedWith)
    {
        this.die();
    }

    isAlive()
    {
        return this.m_playerAlive;
    }

    die()
    {
        this.m_playerAlive = false;

        this.m_playerLives--;

        // ef gildið er -1, þá átti leikmaðurinn engin aukalíf þegar hann dó
        if(this.m_playerLives > -1)
        {
            this.m_playerAlive = true;
        }
        else
        {
            //game over
        }
    }

    giveScore(num)
    {
        this.m_playerScore += num;
    }

    getScore()
    {
        return this.m_playerScore;
    }

    getLives()
    {
        return this.m_playerLives;
    }

    giveLife(num)
    {
        this.m_playerLives += num;
    }

    // TODO: fínpússa?
    shoot()
    {
        // passa að búa ekki til fleiri kúlur en mega vera
        if(bullets.length >= maxBullets)
            return;

        // hraðavigur fyrir kúluna
        let tmpVelY = -bulletSpeed * Math.cos(degToRad(this.m_movementAngle));
        let tmpVelX =  bulletSpeed * Math.sin(degToRad(this.m_movementAngle));

        // staðsetningarvigur fyrir kúluna
        let a2 = (2*grid) * Math.cos(degToRad(this.m_movementAngle));
        let b2 = (2*grid) * Math.sin(degToRad(this.m_movementAngle));

        bullets.push(new Bullet((this.m_posX+b2), (this.m_posY-a2), tmpVelX, tmpVelY, true));
    }

    draw()
    {
        if(this.isAlive())
        {
            super.draw();
        }
    }

    // fall sem athugar árekstra
    check_collision(objectToCheck)
    {
        // sleppum því að skoða árekstra við okkur sjálf
        if(objectToCheck === this)
        {
            return;
        }

        let collision = false;

        // skoða players->bullets árekstra
        if(objectToCheck instanceof Bullet)
        {
            collision = collision_polygon_to_point(this.screen_coordinates(this.m_points),objectToCheck.m_posX,objectToCheck.m_posY);
        }
        else// skoða players->players, players->asteroids og players->saucers árekstra
        {
            collision = collision_polygon_to_polygon(
                this.screen_coordinates(this.m_points.slice(0,4)),
                objectToCheck.screen_coordinates(objectToCheck.m_points));
        }

        if(collision == true)
        {
            // bregðast við árekstrum við okkur
            this.collided(objectToCheck);
        }
    }
}

// Saucer
// grunnclass fyrir óvini
//
// erfir allt sem Polygon hefur
//
class Saucer extends Polygon
{
    constructor(X, Y)
    {
        super();

        this.m_posX = X;
        this.m_posY = Y;

        this.m_maxVel = 3;

        this.m_velX = Math.floor(Math.random()*3);
        this.m_velY = Math.floor(Math.random()*3);

        this.m_rotationSpeed = 0;

        this.m_angle = 0;
        this.m_movementAngle = Math.floor(Math.random()*359);

        this.m_points = [...saucerShape];
    }

    // fall sem bregst við árekstrum
    collided(collidedWith)
    {
        // merkjum formið sem ónýtt
        this.m_destroyed = true;

        // athugum hvort það sem við rákumst á var kúla
        if(collidedWith instanceof Bullet)
        {
            // athugum svo hvort kúlunni var skotið af leikmanni
            if(collidedWith.m_playerBullet == true)
            {
                // verðlaunum leikmanninn vegna nákvæmni hans
                players[0].giveScore(this.m_pointValue);
            }
        }
    }

    draw()
    {
        // teiknað í tvennu lagi til að fá línurnar þvert á skipið
        super.draw(this.m_points.slice(0,8));
        super.draw(this.m_points.slice(8));
    }

    // athuga árekstra
    check_collision(objectToCheck)
    {
        // ekki athuga árekstra við sjálfan sig
        if(objectToCheck === this)
        {
            return;
        }

        let collision = false;

        // þetta fall ætti bara að vera keyrt í saucer->saucer árekstrum
        if(objectToCheck instanceof Saucer)
        {
            collision = collision_polygon_to_polygon(this.screen_coordinates(this.m_points.slice(0,8)),objectToCheck.screen_coordinates(objectToCheck.m_points.slice(0,8)));
        }

        if(collision == true)
        {
            // keyra árekstraviðbragð á þeim sem var rekist á
            objectToCheck.collided(this);
        }
    }
}

// BigEnemy
// class fyrir stóra óvini
//
// erfir allt sem Saucer hefur
// 
// TODO - hegðun
class BigEnemy extends Saucer
{
    constructor(X,Y)
    {
        super(X,Y);
        this.m_scale = 1.25;
        this.m_pointValue = 200;
    }
}

// SmallEnemy
// class fyrir litla óvini
//
// erfir allt sem Saucer hefur
// 
// TODO - hegðun
class SmallEnemy extends Saucer
{
    constructor(X,Y)
    {
        super(X,Y);
        this.m_scale = 0.75;
        this.m_pointValue = 1000;
    }
}

// Asteroid
// class fyrir asteroidin
//
// erfir allt sem Polygon hefur
//
// meðlimabreyta sem bætist við:
//   m_size -> stærð asteroidsins
//
class Asteroid extends Polygon
{
    constructor(X, Y)
    {
        super();

        this.m_posX = X;
        this.m_posY = Y;

        this.m_maxVel = 3;
        this.m_velX = Math.floor(Math.random()*3);
        this.m_velY = Math.floor(Math.random()*3);

        this.m_rotationSpeed = 1;

        // random hvort þeir snúast til vinstri eða hægri
        if(Math.floor(Math.random() * 50) > 25)
        {
            this.m_rotationSpeed *= -1;
        }

        // handahófshorn milli 0 og 359 fyrir bæði hreyfingu og snúning
        this.m_angle = Math.floor(Math.random()*359);
        this.m_movementAngle = Math.floor(Math.random()*359);

        // hvað viljum við c.a. hafa þá stóra/litla?
        // (og hversu margar stærðir viljum við hafa?)

        // smá fikt til að gera manni kleift að nota "klassísku" lögunina fyrir asteroidin
        if(doClassicShapes == true)
        {
            let tmpSize = Math.floor(Math.random() * 98);
            if(tmpSize >= 0 && tmpSize <= 32)
            {
                this.m_scale = 0.7;
                this.m_pointValue = 100;
            }
            else if (tmpSize >= 33 && tmpSize <= 65)
            {
                this.m_scale = 1.33;
                this.m_pointValue = 50;
            }
            else
            {
                this.m_scale = 2.5;
                this.m_pointValue = 20;
            }

            let tmpShape = Math.floor(Math.random() * 99);
            if(tmpShape >= 0 && tmpShape <= 24)
            {
                tmpShape = 0;
            }
            else if(tmpShape >= 25 && tmpShape <= 49)
            {
                tmpShape = 1;
            }
            else if(tmpShape >= 50 && tmpShape <= 74)
            {
                tmpShape = 2;
            }
            else
            {
                tmpShape = 3;
            }
            this.m_points = [...classicAsteroidShapes[tmpShape]];
        }
        else
        {
            let tmpSize = Math.floor(Math.random() * 98);
            if(tmpSize >= 0 && tmpSize <= 32)
            {
                this.m_size = 2;
                this.m_pointValue = 100;
            }
            else if (tmpSize >= 33 && tmpSize <= 65)
            {
                this.m_size = 5;
                this.m_pointValue = 50;
            }
            else
            {
                this.m_size = 8;
                this.m_pointValue = 20;
            }
            this.m_minrad = Math.round(this.m_size/3);
            this.m_points = [...randomShape(10,this.m_minrad,this.m_size)];
        }
    }

    draw()
    {
        super.draw(this.m_points);
    }

    // athuga árekstra
    check_collision(objectToCheck)
    {
        // sleppa því að athuga árekstra við sjálfan sig
        if(objectToCheck === this)
        {
            return;
        }

        let collision = false;

        //þetta ætti bara að keyra í asteroid->asteroid og asteroid->saucers árekstrum
        collision = collision_polygon_to_polygon(this.screen_coordinates(this.m_points),objectToCheck.screen_coordinates(objectToCheck.m_points));

        if(collision == true)
        {
            // keyra viðeigandi árekstraviðbragð
            objectToCheck.collided(this);
        }
    }

    // bregðast við árekstrum
    collided(collidedWith)
    {
        // merkja sem ónýtt
        this.m_destroyed = true;

        //athuga hvort það var kúla sem rakst á okkur
        if(collidedWith instanceof Bullet)
        {
            // athuga hvort það var leikmaður sem skaut henni
            if(collidedWith.m_playerBullet == true)
            {
                // verðlauna leikmanninn fyrir frábært skot
                players[0].giveScore(this.m_pointValue);
            }
        }
    }
}

// fonturinn fyrir leikinn
// stafirnir eru skilgreindir frá neðra vinstra horni í 2x3 hnitakerfi
let font = {
    'A':
    [[[0, 0],[0,-2]],
     [[0,-2],[1,-3]],
     [[1,-3],[2,-2]],
     [[2,-2],[2, 0]],
     [[0,-1],[2,-1]]],
    'B'://
    [[[0  , 0  ],[0  ,-3  ]],
     [[0  ,-3  ],[1.5,-3  ]],
     [[1.5,-3  ],[2  ,-2.5]],
     [[2  ,-2.5],[2  ,-2  ]],
     [[2  ,-2  ],[1.5,-1.5]],
     [[1.5,-1.5],[2  ,-1  ]],
     [[2  ,-1  ],[2  ,-0.5]],
     [[2  ,-0.5],[1.5, 0  ]],
     [[1.5, 0  ],[0  , 0  ]],
     [[0  ,-1.5],[1.5,-1.5]]],
    'C':
    [[[0, 0],[2, 0]],
     [[0, 0],[0,-3]],
     [[0,-3],[2,-3]]],
    'D':
    [[[0, 0],[0,-3]],
     [[0,-3],[1,-3]],
     [[1,-3],[2,-2]],
     [[2,-2],[2,-1]],
     [[2,-1],[1, 0]],
     [[1, 0],[0, 0]]],
    'E':
    [[[0, 0  ],[0  ,-3  ]],
     [[0,-3  ],[2  ,-3  ]],
     [[0, 0  ],[2  , 0  ]],
     [[0,-1.5],[1.5,-1.5]]],
    'F':
    [[[0, 0  ],[0  ,-3  ]],
     [[0,-3  ],[2  ,-3  ]],
     [[0,-1.5],[1.5,-1.5]]],
    'G':
    [[[2,-2],[2,-3]],
     [[2,-3],[0,-3]],
     [[0,-3],[0, 0]],
     [[0, 0],[2, 0]],
     [[2, 0],[2,-1]],
     [[2,-1],[1,-1]]],
    'H':
    [[[0, 0  ],[0,-3  ]],
     [[0,-1.5],[2,-1.5]],
     [[2, 0  ],[2,-3  ]]],
    'I':
    [[[0, 0],[2, 0]],
     [[1, 0],[1,-3]],
     [[0,-3],[2,-3]]],
    'J':
    [[[0,-1],[1,0]],
     [[1,0],[2,0]],
     [[2,0],[2,-3]]],
    'K':
    [[[0,0],[0,-3]],
     [[0,-1.5],[1.5,-3]],
     [[0,-1.5],[1.5,0]]],
    'L':
    [[[0,0],[0,-3]],
     [[0,0],[2,0]]],
    'M':
    [[[0, 0],[0,-3]],
     [[0,-3],[1,-2]],
     [[1,-2],[2,-3]],
     [[2,-3],[2, 0]]],
    'N':
    [[[0, 0],[0,-3]],
     [[0,-3],[2, 0]],
     [[2, 0],[2,-3]]],
    'O':
    [[[0, 0],[0,-3]],
     [[0,-3],[2,-3]],
     [[2,-3],[2, 0]],
     [[2, 0],[0, 0]]],
    'P':
    [[[0, 0  ],[0,-3  ]],
     [[0,-3  ],[2,-3  ]],
     [[2,-3  ],[2,-1.5]],
     [[2,-1.5],[0,-1.5]]],
    'Q':
    [[[0, 0],[0,-3]],
     [[0,-3],[2,-3]],
     [[2,-3],[2,-1]],
     [[2,-1],[1, 0]],
     [[1, 0],[0, 0]],
     [[1,-1],[2, 0]]],
    'R':
    [[[0  , 0  ],[0,-3  ]],
     [[0  ,-3  ],[2,-3  ]],
     [[2  ,-3  ],[2,-1.5]],
     [[2  ,-1.5],[0,-1.5]],
     [[0.5,-1.5],[2, 0  ]]],
    'S':
    [[[0, 0  ],[2, 0  ]],
     [[2, 0  ],[2,-1.5]],
     [[2,-1.5],[0,-1.5]],
     [[0,-1.5],[0,-3  ]],
     [[0,-3  ],[2,-3  ]]],
    'T':
    [[[1, 0],[1,-3]],
     [[0,-3],[2,-3]]],
    'U':
    [[[0,-3],[0, 0]],
     [[0, 0],[2, 0]],
     [[2, 0],[2,-3]]],
    'V':
    [[[0,-3],[1, 0]],
     [[1, 0],[2,-3]]],
    'W':
    [[[0,-3],[0, 0]],
     [[0, 0],[1,-1]],
     [[1,-1],[2, 0]],
     [[2, 0],[2,-3]]],
    'X':
    [[[0, 0],[2,-3]],
     [[0,-3],[2, 0]]],
    'Y':
    [[[0,-3],[1,-2]],
     [[1,-2],[2,-3]],
     [[1,-2],[1, 0]]],
    'Z':
    [[[0,-3],[2,-3]],
     [[2,-3],[0, 0]],
     [[0, 0],[2, 0]]],
    '0':
    [[[0, 0],[0,-3]],
     [[0,-3],[2,-3]],
     [[2,-3],[2, 0]],
     [[2, 0],[0, 0]]],
    '1':
    [[[1,0],[1,-3]]],
    '2':
    [[[0,-3  ],[2,-3  ]],
     [[2,-3  ],[2,-1.5]],
     [[2,-1.5],[0,-1.5]],
     [[0,-1.5],[0, 0  ]],
     [[0, 0  ],[2, 0  ]]],
    '3':
    [[[0,-3  ],[2,-3   ]],
     [[2,-3  ],[2, 0   ]],
     [[2, 0  ],[0, 0   ]],
     [[0,-1.5],[2,-1.5]]],
    '4':
    [[[0,-3  ],[0,-1.5]],
     [[0,-1.5],[2,-1.5]],
     [[2, 0  ],[2,-3  ]]],
    '5':
    [[[0, 0  ],[2, 0  ]],
     [[2, 0  ],[2,-1.5]],
     [[2,-1.5],[0,-1.5]],
     [[0,-1.5],[0,-3  ]],
     [[0,-3  ],[2,-3  ]]],
    '6':
    [[[0,-3  ],[0, 0  ]],
     [[0, 0  ],[2, 0  ]],
     [[2, 0  ],[2,-1.5]],
     [[2,-1.5],[0,-1.5]]],
    '7':
    [[[0,-3],[2,-3]],
     [[2,-3],[2, 0]]],
    '8':
    [[[0, 0  ],[0,-3  ]],
     [[0,-3  ],[2,-3  ]],
     [[2,-3  ],[2, 0  ]],
     [[2, 0  ],[0, 0  ]],
     [[0,-1.5],[2,-1.5]]],
    '9':
    [[[2, 0  ],[2,-3  ]],
     [[2,-3  ],[0,-3  ]],
     [[0,-3  ],[0,-1.5]],
     [[0,-1.5],[2,-1.5]]],
    ':':
    [[[1,-2],[1,-1]]],
    '_':
    [[[0,0],[2,0]]]
};

// drawText()
// fall sem teiknar textastreng
//
// text -> textastrengurinn
// X, Y -> pixel position hnit á skjánum
function drawText(text,X,Y)
{
    // fonturinn hefur enga litla stafi
    text = text.toUpperCase();

    for(let i = 0; i < text.length;i++)
    {
        let charCode = text.charCodeAt(i);
        if((charCode >= 48 && charCode <= 58) || (charCode >= 65 && charCode <= 90) || charCode == 95)
        {
            drawLetter(text.charAt(i),X+(i*3*grid),Y);
        }
    }
}

// drawLetter()
// fall til að teikna stakan staf. Stafir sem eru ekki skilgreindir í font objectinu teiknast sem bil
// 
// letter -> stafur til að teikna
//  X,  Y -> pixel position hnit á skjánum
function drawLetter(letter,X,Y)
{
    // hliðra hnitunum á canvasinum til að stafirnir komi ekki blurry
    context.translate(0.5,0.5);

    // tvípunktur er sértilfelli
    // hann er ekki smíðaður úr línum eins og hinir stafirnir
    // hnitin í fylkinu hans eru staðsetningar á hringunum sem mynda tvípunktinn
    if(letter == ':')
    {
        let X1 = font[letter][0][0][0];// efri X
        let Y1 = font[letter][0][0][1];// efri Y
        let X2 = font[letter][0][1][0];// neðri X
        let Y2 = font[letter][0][1][1];// neðri Y
        drawCircle(X1,Y1,X,Y);
        drawCircle(X2,Y2,X,Y);
    }
    else
    {
        // teikna stafinn línu fyrir línu
        for(let i = 0;i < font[letter].length;i++)
        {
            let X1 = font[letter][i][0][0];
            let Y1 = font[letter][i][0][1];
            let X2 = font[letter][i][1][0];
            let Y2 = font[letter][i][1][1];
            drawLine(X1,Y1,X2,Y2,X,Y);
        }
    }

    // hliðra hnitunum á canvasnum til baka svo að allt nema stafirnir komi ekki blurry
    context.translate(-0.5,-0.5);
}

// drawCircle()
// fall til að teikna stakan radius 2 hring
//
//     X,     Y -> staðsetning hringsins í 2x3 grid, samskonar og font objectið notar
// drawX, drawY -> pixel position hnit á skjánum
function drawCircle(X,Y,drawX,drawY)
{
    // geyma teiknistillingarnar á canvasnum
    context.save();

    context.fillStyle = 'white';

    context.beginPath();
    context.arc((X*grid)+drawX,(Y*grid)+drawY,2,0,2*Math.PI);
    context.fill();

    // sækja geymdu teiknistillingarnar á canvasnum
    context.restore();
}

// drawLine()
// fall sem teiknar staka línu
//
//    X1,    Y1 -> upphafspunktur, 2x3 grid
//    X2,    Y2 -> endapunktur, 2x3 grid
// drawX, drawY -> pixel position hnit á skjánum
function drawLine(X1,Y1,X2,Y2,drawX,drawY)
{
    context.beginPath();
    context.moveTo((X1*grid)+drawX,(Y1*grid)+drawY);
    context.lineTo((X2*grid)+drawX,(Y2*grid)+drawY);
    context.stroke();
}

// nokkur fylki til að halda utan um ýmis form
// þessi form ganga beint inni í m_points í tilfellum af Polygon-afleiðu klösum

// óvinur
const saucerShape =
[
    // útlínur
    [-0.5,-1.5],
    [ 0.5,-1.5],
    [   1,-0.5],
    [ 2.5, 0.5],
    [   1, 1.5],
    [  -1, 1.5],
    [-2.5, 0.5],
    [  -1,-0.5],
    // miðjubútur til að fá línur þvert á skipið
    [-2.5, 0.5],
    [  -1,-0.5],
    [   1,-0.5],
    [ 2.5, 0.5]
];

// nýmóðins skipið okkar Óla
const newShipShape = 
[
    //skipið
    [   0,-1.5],
    [   1, 1.5],
    [   0, 0.5],
    [  -1, 1.5],
    //eldurinn
    [-0.5,   1],
    [   0, 1.5],
    [ 0.5,   1],
    [   0, 0.5]
];

// klassíska 1979 skipið úr upprunalega leiknum
const classicShipShape =
[
    //skipið
    [   0,-1.5],
    [   1, 1.5],
    [ 0.5,   1],
    [-0.5,   1],
    [  -1, 1.5],
    //eldurinn
    [ 0.5,   1],
    [   0,   2],
    [-0.5,   1]
];

// klassísku 1979 loftsteinarnir úr upprunalega leiknum
const classicAsteroidShapes =
[
    [[  -2,  -1],
     [  -1,  -2],
     [   0,  -1],
     [   1,  -2],
     [   2,  -1],
     [ 1.5,   0],
     [   2,   1],
     [ 0.5,   2],
     [  -1,   2],
     [  -2,   1]],

    [[  -2,  -1],
     [  -1,  -2],
     [   0,-1.5],
     [   1,  -2],
     [   2,  -1],
     [   1,-0.5],
     [   2, 0.5],
     [   1,   2],
     [-0.5, 1.5],
     [  -1,   2],
     [  -2,   1],
     [-1.5,   0]],

    [[  -2,-0.5],
     [-0.5,  -2],
     [   1,  -2],
     [   2,-0.5],
     [   2, 0.5],
     [   1,   2],
     [   0,   2],
     [   0, 0.5],
     [  -1,   2],
     [  -2, 0.5],
     [  -1,   0]],

    [[  -2,  -1],
     [-0.5,  -1],
     [  -1,  -2],
     [ 0.5,  -2],
     [   2,  -1],
     [   2,-0.5],
     [ 0.5,   0],
     [   2,   1],
     [   1,   2],
     [ 0.5, 1.5],
     [  -1,   2],
     [  -2, 0.5]]
];

// incrementTimer()
// telur upp um 1 fyrir hverjar 10 millisekúndur
function incrementTimer()
{
    runtimeMilliseconds++;
}

//
// Restin neðan við þessa línu eru föll til að athuga hvort
// hin og þessi form séu að rekast saman.
// Þau eru fleiri en þessi leikur þarf en ég hugsaði að það
// væri gagnlegt að skrifa þau öll ef þau skyldu nýtast í
// önnur verkefni í framtíðinni.
//
// Þekkingin til að gera þessi föll kom að mestu úr vefbókinni
// "Collision Detection" eftir Jeff Thompson.
//
// Bókin er aðgengileg án endurgjalds hérna:
// http://www.jeffreythompson.org/collision-detection/
//

// collision_point_to_point()
// athugar árekstur á milli tveggja punkta
//
// p1x, p1y -> X og Y hnit á fyrri punktinum (pixel position hnit)
// p2x, p2y -> X og Y hnit á seinni punktinum (pixel position hnit)
// sensitivity -> næmnin á árekstrinum
//
// TODO: bæta við virkni á sensitivity breytunni
function collision_point_to_point(p1x, p1y, p2x, p2y, sensitivity = 1)
{
    // ef punktarnir eru á sama stað, þá er árekstur
    if(p1x == p2x && p1y == p2y)
    {
        return true;
    }

    return false;
}

// collision_point_to_circle()
// athugar árekstur á milli punkts og hrings
//
// p1x, p1y -> X og Y hnit á punktinum (pixel position hnit)
// cx, cy -> X og Y hnit á miðjupunkti hringsins (pixel position hnit)
// cr -> radíus hringsins (pixel stærð)
function collision_point_to_circle(px, py, cx, cy, cr)
{
    // pýþagóras til að finna lengd línunnar á milli punktsins og hringsins
    let A = px - cx;
    let B = py - cy;
    let C = Math.sqrt((A*A)+(B*B));

    // ef sú lengd er minni en eða sama og radíus hringsins, þá er árekstur
    if(C <= cr)
    {
        return true;
    }

    return false;
}

// collision_circle_to_circle()
// athugar árekstur á milli tveggja hringja
//
// c1x, c1y -> X og Y hnit á miðjupunkti fyrri hringsins (pixel position hnit)
// c1r -> radíus fyrri hringsins (pixel stærð)
// c1x, c1y -> X og Y hnit á miðjupunkti seinni hringsins (pixel position hnit)
// c1r -> radíus seinni hringsins (pixel stærð)
function collision_circle_to_circle(c1x, c1y, c1r, c2x, c2y, c2r)
{
    // pýþagóras til að finna lengd línunnar á milli miðjupunkta hringjanna
    let A = c1x - c2x;
    let B = c1y - c2y;
    let C = Math.sqrt((A*A)+(B*B));

    // ef samanlagður radíus hringjanna er minni en eða
    // sami og fjarlægðin á milli miðjupunktanna, þá er árekstur
    if(C <= (c1r+c2r))
    {
        return true;
    }

    return false;
}

// collision_point_to_rectangle()
// athugar árekstur á milli punkts og ferhyrnings
//
// px, py -> X og Y hnit á punktinum (pixel position hnit)
// rx, ry -> X og Y hnit á efra vinstra horni ferhyrningsins (pixel position hnit)
// rw, rh -> breidd og hæð ferhyrningsins (pixel stærð)
function collision_point_to_rectangle(px, py, rx, ry, rw, rh)
{
    // læsileikabreytur fyrir mörk ferhyrningsins
    let leftEdge = rx;
    let rightEdge = rx+rw;
    let topEdge = ry;
    let bottomEdge = ry+rh;

    // ef x er innan vinstri/hægri marka ferhyrningsins
    // og y er innan efri/neðri marka ferhyrningsins
    // þá er árekstur
    if((px >= leftEdge) &&
       (px <= rightEdge) && 
       (py >= topEdge) &&
       (py <= bottomEdge))
    {
        return true;
    }

    return false;
}

// collision_rectangle_to_rectangle()
// athugar árekstra á milli tveggja ferhyrninga
//
// r1x, r1y -> X og Y hnit á efra vinstra horni fyrri ferhyrningsins (pixel position hnit)
// r1w, r1h -> breidd og hæð fyrri ferhyrningsins (pixel stærð)
// r2x, r2y -> X og Y hnit á efra vinstra horni seinni ferhyrningsins (pixel position hnit)
// r2w, r2h -> breidd og hæð seinni ferhyrningsins (pixel stærð)
function collision_rectangle_to_rectangle(r1x, r1y, r1w, r1h, r2x, r2y, r2w, r2h)
{
    // læsileikabreytur fyrir mörk ferhyrninganna
    let r1_leftEdge = r1x;
    let r1_rightEdge = r1x+r1w;
    let r1_topEdge = r1y;
    let r1_bottomEdge = r1y+r1h;

    let r2_leftEdge = r2x;
    let r2_rightEdge = r2x+r2w;
    let r2_topEdge = r2y;
    let r2_bottomEdge = r2y+r2h;

    // ef hægri brún r1 er hægra megin við vinstri brún r2
    // og vinstri brún r1 er vinstra megin við hægri brún r2
    // og neðri brún r1 er neðan við efri brún r2
    // og efri brún r1 er ofan við neðri brún r2
    // þá er árekstur
    if(( r1_rightEdge >= r2_leftEdge ) &&
       ( r1_leftEdge <= r2_rightEdge ) &&
       ( r1_bottomEdge >= r2_topEdge ) &&
       ( r1_topEdge <= r2_bottomEdge ))
    {
        return true;
    }

    return false;
}

// collision_circle_to_rectangle()
// athugar árekstra á milli hrings og ferhyrnings
//
// cx, cy -> X og Y hnit á miðjupunkti hringsins (pixel position hnit)
// cr -> radíus hringsins (pixel stærð)
// rx, ry -> X og Y hnit á efra vinstra horni ferhyrningsins (pixel position hnit)
// rw, rh -> breidd og hæð ferhyrningsins (pixel stærð)
function collision_circle_to_rectangle(cx, cy, cr, rx, ry, rw, rh)
{
    // læsileikabreytur fyrir mörk ferhyrningsins
    let leftEdge = rx;
    let rightEdge = rx+rw;
    let topEdge = ry;
    let bottomEdge = ry+rh;

    // byrja á að skoða staðsetningu hringsins
    let tmpX = cx;
    let tmpY = cy;

    // ef hringurinn er hægra megin við ferhyrninginn, þá berum við saman við hægri brúnina á X ás
    // ef hringurinn er vinstra megin við ferhyrninginn, þá berum við saman við vinstri brúnina á X ás
    // TODO: finna út hvort <= og >= séu betri
    if(tmpX > rightEdge)
    {
        tmpX = rightEdge;
    }
    else if(tmpX < leftEdge)
    {
        tmpX = leftEdge;
    }

    // ef hringurinn er neðan við ferhyrninginn, þá berum við saman við neðri brúnina á Y ás
    // ef hringurinn er ofan við ferhyrninginn, þá berum við saman við efri brúnina á Y ás
    // TODO: finna út hvort <= og >= séu betri
    if(tmpY > bottomEdge)
    {
        tmpY = bottomEdge;
    }
    else if(tmpY < topEdge)
    {
        tmpY = topEdge;
    }

    // pýþagóras til að reikna fjarlægðina á milli hringsins og brúnanna sem við völdum hér að ofan
    let A = cx-tmpX;
    let B = cy-tmpY;
    let C = Math.sqrt((A*A)+(B*B));

    // ef sú fjarlægð er minni en radíus hringsins, þá er árekstur
    if(C <= cr)
    {
        return true;
    }

    return false;
}

// collision_line_to_point()
// athugar árekstur á milli línu og punkts
//
// l1x, l1y -> X og Y hnit á upphafspunkti línunnar (pixel position hnit)
// l2x, l2y -> X og Y hnit á endapunkti línunnar (pixel position hnit)
// px, py -> X og Y hnit á punktinum (pixel position hnit)
// sensitivity -> næmni árekstursins, næmnin hækkar með lækkandi gildi
function collision_line_to_point(l1x, l1y, l2x, l2y, px, py, sensitivity = 0.1)
{
    // pýþagóras til að finna lengd línunnar
    let lA = l2x-l1x;
    let lB = l2y-l1y;
    let lC = Math.sqrt((lA*lA)+(lB*lB));

    // pýþagóras til að finna lengd milli punkts og fyrri punkts línunnar
    let p1A = l1x-px;
    let p1B = l1y-py;
    let p1C = Math.sqrt((p1A*p1A)+(p1B*p1B));

    // pýþagóras til að finna lengd milli punkts og seinni punkts línunnar
    let p2A = l2x-px;
    let p2B = l2y-py;
    let p2C = Math.sqrt((p2A*p2A)+(p2B*p2B));

    // ef samanlögð lengd á p1C og p2C er sú sama og lengd línunnar, þá er árekstur
    if(((p1C+p2C) >= lC-sensitivity) &&
       ((p1C+p2C) <= lC+sensitivity))
    {
        return true;
    }

    return false;
}

// collision_line_to_circle()
// athugar árekstur á milli línu og hrings
//
// l1x, l1y -> X og Y hnit á upphafspunkti línunnar (pixel position hnit)
// l2x, l2y -> X og Y hnit á endapunkti línunnar (pixel position hnit)
// cx, cy -> X og Y hnit á miðjupunkti hringsins (pixel position hnit)
// cr -> radíus hringsins (pixel stærð)
function collision_line_to_circle(l1x, l1y, l2x, l2y, cx, cy, cr)
{
    // athuga hvort upphafs- eða endapunktur línunnar sé inni í hringnum
    let p1Inside = collision_point_to_circle(l1x,l1y,cx,cy,cr);
    let p2Inside = collision_point_to_circle(l2x,l2y,cx,cy,cr);

    // ef annar þeirra er inni í hringnum, þá er árekstur
    if(p1Inside == true || p2Inside == true)
    {
        return true;
    }

    // ef þeir voru ekki inni í hringnum, þá þarf að reikna smá

    // skilgreina vigur fyrir línuna
    let dx = l2x-l1x;
    let dy = l2y-l1y;

    // reikna lengdina á vigrinum með pýþagórasarreglunni
    let magnitude = Math.sqrt((dx*dx)+(dy*dy));

    // breyta vigrinum í einingarvigur
    dx /= magnitude;
    dy /= magnitude;

    // skilgreina vigur milli fyrri punkts línunnar og miðjupunkt hringsins
    let dxC = cx-l1x;
    let dyC = cy-l1y;

    // reikna innfeldið á einingarvigri línunnar og hinum vigrinum
    let dotProduct = (dx * dxC) + (dy * dyC);

    // lengja einingarvigurinn um innfeldið og hliðra honum um upphafspunkt línunnar
    // til að fá út punkt á línunni sem er næstur hringnum
    let tmpX = (dx * dotProduct) + l1x;
    let tmpY = (dy * dotProduct) + l1y;

    // athuga hvort sá punktur liggi á línunni
    let onLine = collision_line_to_point(l1x,l1y,l2x,l2y,tmpX,tmpY);

    // ef hann gerir það ekki, þá er enginn árekstur mögulegur
    if(onLine != true)
    {
        return false;
    }

    // pýþagóras til að reikna fjarlægð á milli punktsins á línunni og hringsins
    let tA = tmpX-cx;
    let tB = tmpY-cy;
    let tC = Math.sqrt((tA*tA)+(tB*tB));

    // ef sú fjarlægð er minni en radíus hringsins, þá er árekstur
    if(tC <= cr)
    {
        return true;
    }

    return false;
}

// collision_line_to_line()
// athugar árekstra á milli tveggja lína
//
// l1x, l1y -> X og Y hnit á upphafspunkti fyrri línunnar (pixel position hnit)
// l2x, l2y -> X og Y hnit á endapunkti fyrri línunnar (pixel position hnit)
// l3x, l3y -> X og Y hnit á upphafspunkti seinni línunnar (pixel position hnit)
// l4x, l4y -> X og Y hnit á endapunkti seinni línunnar (pixel position hnit)
function collision_line_to_line(l1x,l1y,l2x,l2y,l3x,l3y,l4x,l4y)
{
    // Sjá "Intersection Point of Two Lines (2 Dimensions)"
    // eftir Paul Bourke fyrir nákvæma útskýringu á því hvernig þessi
    // aðferð virkar.
    // Aðgengilegt hérna: https://paulbourke.net/geometry/pointlineplane/
    let uA = ((l4x-l3x)*(l1y-l3y) - (l4y-l3y)*(l1x-l3x)) /
             ((l4y-l3y)*(l2x-l1x) - (l4x-l3x)*(l2y-l1y));

    let uB = ((l2x-l1x)*(l1y-l3y) - (l2y-l1y)*(l1x-l3x)) /
             ((l4y-l3y)*(l2x-l1x) - (l4x-l3x)*(l2y-l1y));

    // ef uA og uB liggja báðir milli 0 og 1, þá skerast línurnar og það verður árekstur
    if(uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1)
    {
        return true;
    }

    return false;
}

// collision_line_to_rectangle()
// athugar árekstra á milli línu og ferhyrnings
//
// l1x, l1y -> X og Y hnit á upphafspunkti línunnar (pixel position hnit)
// l2x, l2y -> X og Y hnit á endapunkti línunnar (pixel position hnit)
// rx, ry -> X og Y hnit á efra vinstra horni ferhyrningsins (pixel position hnit)
// rw, rh -> breidd og hæð ferhyrningsins (pixel stærð)
function collision_line_to_rectangle(l1x,l1y,l2x,l2y,rx,ry,rw,rh)
{
    // hnit línanna sem marka hliðar ferhyrningsins
    let leftx, lefty1, lefty2;
    let rightx, righty1, righty2;
    let topx1, topy, topx2;
    let bottomx1, bottomy, bottomx2;

    leftx = rx;
    lefty1 = ry;
    //leftx2 er sama og leftx
    lefty2 = ry+rh;

    rightx = rx+rw;
    righty1 = ry;
    //rightx2 er sama og rightx
    righty2 = ry+rh;

    topx1 = rx;
    topy = ry;
    topx2 = rx+rw;
    //topy2 er sama og topy

    bottomx1 = rx;
    bottomy = ry+rh;
    bottomx2 = rx+rw;
    //bottomy2 er sama og bottomy

    // athuga hvort línan sem er verið að prófa rekst á einhverja hliðum ferhyrningsins
    let collisionLeft = collision_line_to_line(l1x,l1y,l2x,l2y,leftx,lefty1,leftx,lefty2);
    let collisionRight = collision_line_to_line(l1x,l1y,l2x,l2y,rightx,righty1,rightx,righty2);
    let collisionTop = collision_line_to_line(l1x,l1y,l2x,l2y,topx1,topy,topx2,topy);
    let collisionBottom = collision_line_to_line(l1x,l1y,l2x,l2y,bottomx1,bottomy,bottomx2,bottomy);

    // ef hún gerir það, þá er árekstur
    if( collisionLeft == true || collisionRight == true || collisionTop == true || collisionBottom == true)
    {
        return true;
    }

    return false;
}

// collision_polygon_to_point()
// athugar árekstur á milli polygons og punkts
//
// vertices -> fylki með X,Y hnitum allra punktanna á polygoninum (ATH: ekki m_points, heldur eftir umbreytingar)
// px, py -> X og Y hnit á punktinum (pixel position hnit)
function collision_polygon_to_point(vertices, px, py)
{
    // breytur til að auka læsileika
    const X = 0;
    const Y = 1;

    let collision = false;

    let next = 0;
    // fara yfir alla punktana á polygoninum
    for(let current = 0; current < vertices.length; current++)
    {
        // sækja index á næsta punkti
        next = current + 1;

        // ef við erum komin út fyrir fylkið, þá notum við fyrsta sem endapunkt
        if(next == vertices.length)
        {
            next = 0;
        }

        let currentVertex = vertices[current];
        let nextVertex = vertices[next];

        if(
            // athuga fyrst hvort Y hnit punktsins liggi á milli Y hnita beggja vertexanna
            ((currentVertex[Y] > py) != (nextVertex[Y] > py)) &&
            // beita svo Jordan Curve Theorem göldrum til að athuga hvort fjöldi skipta sem
            // lína frá punktinum "stígur yfir" jaðar polygonsins sé oddatala eða slétt tala
            (px < (nextVertex[X]-currentVertex[X]) * (py-currentVertex[Y]) / (nextVertex[Y]-currentVertex[Y]) + currentVertex[X]))
        {
            collision = !collision;
        }
    }

    // oddatala = true -> punkturinn liggur inni í polygoninum
    // slétt tala = false -> punkturinn liggur utan við polygoninn
    //
    // sjá hér: https://sidvind.com/wiki/Point-in-polygon:_Jordan_Curve_Theorem
    // og hér: https://en.wikipedia.org/wiki/Point_in_polygon
    // fyrir nánari útskýringar

    return collision;
}

// collision_polygon_to_circle()
// athugar árekstra á milli polygons og hrings
//
// vertices -> fylki með X,Y hnitum allra punktanna á polygoninum (ATH: ekki m_points, heldur eftir umbreytingar)
// cx, cy -> X og Y hnit á miðjupunkti hringsins (pixel position hnit)
// cr -> radíus hringsins (pixel stærð)
// testInside -> skal athuga hvort hringurinn í heild sinni sé inni í polygoninum?
//               (þyngra í vinnslu, default er að sleppa því)
function collision_polygon_to_circle(vertices, cx, cy, cr, testInside = false)
{
    // breytur til að auka læsileika
    const X = 0;
    const Y = 1;

    let next = 0;
    // fara yfir alla punktana á polygoninum
    for(let current = 0; current < vertices.length; current++)
    {
        // sækja index á næsta punkti
        next = current + 1;

        // ef við erum komin út fyrir fylkið, þá notum við fyrsta sem endapunkt
        if(next == vertices.length)
        {
            next = 0;
        }

        let currentVertex = vertices[current];
        let nextVertex = vertices[next];

        // athuga hvort hringurinn snerti línuna sem markast af currentVertex og nextVertex
        let collision = collision_line_to_circle(currentVertex[X], currentVertex[Y], nextVertex[X], nextVertex[Y], cx,cy,cr);

        // ef hann gerir það, þá er árekstur og við þurfum ekki að skoða fleiri punkta
        if(collision == true)
        {
            return true;
        }
    }

    // ef við komumst alla leið hingað án árekstra er ennþá mögulegt að
    // hringurinn í heild sinni sé inni í polygoninum.
    // ATH: þetta þyngir vinnsluna. Ef það er hægt að komast af án þess
    // að athuga þetta, þá er það betri kostur
    if(testInside == true)
    {
        let centerPointInside = collision_polygon_to_point(vertices,cx,cy);
        if(centerPointInside == true)
        {
            return true;
        }
    }

    return false;
}

// collision_polygon_to_rectangle()
// athugar árekstra á milli polygons og ferhyrnings
//
// vertices -> fylki með X,Y hnitum allra punktanna á polygoninum (ATH: ekki m_points, heldur eftir umbreytingar)
// rx, ry -> X og Y hnit á efra vinstra horni ferhyrningsins (pixel position hnit)
// rw, rh -> breidd og hæð ferhyrningsins (pixel stærð)
// testInside -> skal athuga hvort ferhyrningurinn í heild sinni sé inni í polygoninum?
//               (þyngra í vinnslu, default er að sleppa því)
function collision_polygon_to_rectangle(vertices, rx, ry, rw, rh, testInside = false)
{
    // breytur til að auka læsileika
    const X = 0;
    const Y = 1;

    let next = 0;
    // fara yfir alla punktana á polygoninum
    for(let current = 0; current < vertices.length; current++)
    {
        // sækja index á næsta punkti
        next = current + 1;

        // ef við erum komin út fyrir fylkið, þá notum við fyrsta sem endapunkt
        if(next == vertices.length)
        {
            next = 0;
        }

        let currentVertex = vertices[current];
        let nextVertex = vertices[next];

        // athuga hvort ferhyrningurinn snerti línuna sem markast af currentVertex og nextVertex
        let collision = collision_line_to_rectangle(currentVertex[X],currentVertex[Y],nextVertex[X],nextVertex[Y],rx,ry,rw,rh);

        // ef hann gerir það, þá er árekstur og við þurfum ekki að skoða fleiri punkta
        if(collision == true)
        {
            return true;
        }
    }

    // ef við komumst alla leið hingað án árekstra er ennþá mögulegt að
    // ferhyrningurinn í heild sinni sé inni í polygoninum.
    // ATH: þetta þyngir vinnsluna. Ef það er hægt að komast af án þess
    // að athuga þetta, þá er það betri kostur
    if(testInside == true)
    {
        let rectangleInside = collision_polygon_to_point(vertices, rx, ry);
        if(rectangleInside == true)
        {
            return true;
        }
    }

    return false;
}

// collision_polygon_to_line()
// athugar árekstra á milli polygons og línu
//
// vertices -> fylki með X,Y hnitum allra punktanna á polygoninum (ATH: ekki m_points, heldur eftir umbreytingar)
// l1x, l1y -> X og Y hnit á upphafspunkti línunnar (pixel position hnit)
// l2x, l2y -> X og Y hnit á endapunkti línunnar (pixel position hnit)
function collision_polygon_to_line(vertices, l1x, l1y, l2x, l2y)
{
    // breytur til að auka læsileika
    const X = 0;
    const Y = 1;

    let next = 0;
    // fara yfir alla punktana á polygoninum
    for(let current = 0; current < vertices.length; current++)
    {
        // sækja index á næsta punkti
        next = current + 1;

        // ef við erum komin út fyrir fylkið, þá notum við fyrsta sem endapunkt
        if(next == vertices.length)
        {
            next = 0;
        }

        let l3x = vertices[current][X];
        let l3y = vertices[current][Y];
        let l4x = vertices[next][X];
        let l4y = vertices[next][Y];

        // athuga hvort línan sker/snertir línuna sem markast af currentVertex og nextVertex
        let collision = collision_line_to_line(l1x,l1y,l2x,l2y,l3x,l3y,l4x,l4y);

        //ef hún gerir það, þá er árekstur og við þurfum ekki að skoða fleiri punkta
        if(collision == true)
        {
            return true;
        }
    }

    return false;
}

// collision_polygon_to_polygon()
// athugar árekstra á milli polygons og polygons
//
// vertices1 -> fylki með X,Y hnitum allra punktanna á polygoninum (ATH: ekki m_points, heldur eftir umbreytingar)
// vertices2 -> fylki með X,Y hnitum allra punktanna á polygoninum (ATH: ekki m_points, heldur eftir umbreytingar)
// testInside -> skal athuga hvort polygon2 í heild sinni sé inni í polygon1?
//               (þyngra í vinnslu, default er að sleppa því)
function collision_polygon_to_polygon(vertices1, vertices2, testInside = false)
{
    // breytur til að auka læsileika
    const X = 0;
    const Y = 1;

    let next = 0;
    // fara yfir alla punktana á polygon1
    for(let current = 0; current < vertices1.length; current++)
    {
        // sækja index á næsta punkti
        next = current + 1;

        // ef við erum komin út fyrir fylkið, þá notum við fyrsta sem endapunkt
        if(next == vertices1.length)
        {
            next = 0;
        }

        let currentVertex = vertices1[current];
        let nextVertex = vertices1[next];

        //athuga hvort polygon2 sé með árekstur við línuna sem markast af currentVertex og nextVertex
        let collision = collision_polygon_to_line(vertices2, currentVertex[X], currentVertex[Y], nextVertex[X], nextVertex[Y]);

        //ef svo er, þá er árekstur og við þurfum ekki að skoða fleiri punkta
        if(collision == true)
        {
            return true;
        }
    }

    // ef við komumst alla leið hingað án árekstra er ennþá mögulegt að
    // polygoninn í heild sinni sé inni í hinum polygoninum.
    // ATH: þetta þyngir vinnsluna. Ef það er hægt að komast af án þess
    // að athuga þetta, þá er það betri kostur
    if(testInside == true)
    {
        let polygonInside = collision_polygon_to_point(vertices1, vertices2[0][X], vertices2[0][Y]);
        if(polygonInside == true)
        {
            return true;
        }
    }

    return false;
}

// collision_triangle_to_point()
// athugar árekstra á milli þríhyrnings og punkts
//
// t1x, t1y -> X og Y hnit á fyrsta horninu á þríhyrningnum (pixel position hnit)
// t2x, t2y -> X og Y hnit á öðrum horninu á þríhyrningnum (pixel position hnit)
// t3x, t3y -> X og Y hnit á þriðja horninu á þríhyrningnum (pixel position hnit)
// px, py -> X og Y hnit á punktinum (pixel position hnit)
function collision_triangle_to_point(t1x,t1y,t2x,t2y,t3x,t3y,px,py)
{
    // formúla Herons til að finna flatarmál þríhyrningsins
    let areaT = Math.abs(((t2x-t1x)*(t3y-t1y))-((t3x-t1x)*(t2y-t1y)));

    // myndum svo 3 nýja þríhyrninga með px,py punktinum og hverri hlið um sig í upprunalega þríhyrningnum
    // og reiknum flatarmál þeirra með formúlu Herons
    let area1 = Math.abs(((t1x-px)*(t2y-py))-((t2x-px)*(t1y-py)));
    let area2 = Math.abs(((t2x-px)*(t2y-py))-((t3x-px)*(t2y-py)));
    let area3 = Math.abs(((t3x-px)*(t1y-py))-((t1x-px)*(t3y-py)));

    // ef samanlagt flatarmál þessara 3 þríhyrninga er það sama og flatarmál upprunalega þríhyrningsins
    // þá er árekstur
    if(area1+area2+area3 == areaT)
    {
        return true;
    }

    return false;
}
