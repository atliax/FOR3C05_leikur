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

// fjöldi stjarna á bakgrunnsmynd
const NUM_STARS = 500;

// skölunarbreyta fyrir öll form/hluti
const grid = 10;

// constantar fyrir leikmann
const playerStartX = context.canvas.width/2;
const playerStartY = context.canvas.height/2;
const playerSpeed = 0.3;
const playerMaxSpeed = 5;
const playerRotationSpeed = 15;
const playerStartLives = 4;

// tmp
let playerLives = playerStartLives;
let playerScore = 0;

// object sem geymir upplýsingar um það hvaða takka er verið að ýta á
let keys = {
    KEY_LEFT: false,
    KEY_RIGHT: false,
    KEY_UP: false,
    KEY_DOWN: false,
    KEY_SPACE: false,
    KEY_S: false,
    KEY_E: false
};

// fylki til að geyma hlutina sem eru til staðar í leiknum
let asteroids = [];
let saucers = [];

let generatedBackground = false;
let storedBackground;

//default stillingar á canvas teikningunum
context.strokeStyle = "white";
context.fillStyle = "black";
context.lineWidth = 1;

//atburðahlustarar
document.addEventListener("keydown",keydown);
document.addEventListener("keyup",keyup);

//fyrsta kallið á aðallykkjufallið, það kallar svo sjálft aftur á sig
window.requestAnimationFrame(update);

// update()
// fall sem hýsir aðallykkju leiksins
function update()
{
    handleKeys();

    player.move();
    if(asteroids.length > 0)
    {
        for(let i = 0; i < asteroids.length;i++)
        {
            asteroids[i].move();
            asteroids[i].rotate();
        }
    }

    if(saucers.length > 0)
    {
        for(let i = 0; i < saucers.length;i++)
        {
            saucers[i].move();
        }
    }

    //skoða árekstra hér?

    draw_background();

    if(asteroids.length > 0)
    {
        for(let i = 0; i < asteroids.length;i++)
        {
            asteroids[i].draw();
        }
    }
    player.draw();

    if(saucers.length > 0)
    {
        for(let i = 0; i < saucers.length;i++)
        {
            saucers[i].draw();
        }
    }

    drawGUI();

    window.requestAnimationFrame(update);
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
    drawText(playerScore.toString(),5,35);
}

// drawLives()
// teiknar lífin sem leikmaður á eftir
function drawLives()
{
    let tmpShip = new Ship(0,60);
    for(let i = 0; i < playerLives; i++)
    {
        tmpShip.m_posX = (i*2.5*grid)+20;
        tmpShip.draw();
    }
}

// handleKeys()
// bregst við eftir því sem við á ef takki á lyklaborði er niðri
function handleKeys()
{
    if(keys[KEY_LEFT] == true)
    {
        player.rotate(-player.m_rotationSpeed);
    }

    if(keys[KEY_RIGHT] == true)
    {
        player.rotate(player.m_rotationSpeed);
    }

    if(keys[KEY_UP] == true)
    {
        player.thrust();
        player.m_drawFlame = true;
    }
    else
    {
        player.thrust(0);
        player.m_drawFlame = false
    }

    if(keys[KEY_SPACE] == true)
    {
        playerLives -= 1; //tmp
        //player.shoot();
    }

    if(keys[KEY_S] == true) // prufa, býr til asteroid
    {
        let asteroidStartX = Math.floor(Math.random()*(context.canvas.width-1));
        let asteroidStartY = Math.floor(Math.random()*(context.canvas.height-1));
        asteroids.push(new Asteroid(asteroidStartX,asteroidStartY));
        playerScore += 1; //tmp
    }

    if(keys[KEY_E] == true) // prufa, býr til óvini
    {
        let saucerStartX = Math.floor(Math.random()*(context.canvas.width-1));
        let saucerStartY = Math.floor(Math.random()*(context.canvas.height-1));
        if(Math.floor(Math.random() * 50) > 25)
        {
            saucers.push(new BigSaucer(saucerStartX,saucerStartY));
        }
        else
        {
            saucers.push(new SmallSaucer(saucerStartX,saucerStartY));
        }
        playerLives += 1; //tmp
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
    if(event.keyCode == KEY_LEFT ||
        event.keyCode == KEY_RIGHT ||
        event.keyCode == KEY_UP ||
        event.keyCode == KEY_SPACE ||
        event.keyCode == KEY_S ||
        event.keyCode == KEY_E)
    {
        keys[event.keyCode] = true;
    }
}

// keyup()
// atburðahöndlari fyrir keyup atburði
// "skrifar" hjá sér takka sem er sleppt
function keyup(event)
{
    if(event.keyCode == KEY_LEFT ||
        event.keyCode == KEY_RIGHT ||
        event.keyCode == KEY_UP ||
        event.keyCode == KEY_SPACE ||
        event.keyCode == KEY_S ||
        event.keyCode == KEY_E)
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
// [X,Y] -> hnitin
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
// member breytur:
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

        this.m_points = [];
    }

    // meðlimafall sem tekur við fylki af hnitum og teiknar línur á milli þeirra
    // endar á því að tengja seinasta punkt við upphafspunkt
    // hver undirclass keyrir þetta fall og gefur því fylki
    draw(pointsArray)
    {
        // afrit tekið vegna þess að við munum breyta hnitunum talsvert mikið til að teikna þau
        let points = [...pointsArray];

        for(let i = 0; i < points.length; i++)
        {
            // snúa hnitunum um m_angle
            points[i] = rotate(points[i],this.m_angle);
            // "ytri" skölun á forminu (grid)
            points[i] = [points[i][0]*grid,points[i][1]*grid];
            // "innri" skölun á forminu (m_scale)
            points[i] = [Math.round(points[i][0]*this.m_scale),Math.round(points[i][1]*this.m_scale)];
            // translation yfir á réttan stað á skjánum (pixel position)
            points[i] = [points[i][0]+this.m_posX,points[i][1]+this.m_posY];
        }

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

    //meðlimafall sem stillir hröðun formsins
    //notað til að stoppa líka með .thrust(0)
    thrust(power = this.m_movementSpeed)
    {
        this.m_thrust = power;
    }

    //meðlimafall sem hreyfir formið út frá m_thrust
    move()
    {
        // reikna hraðabreytinguna á ásunum
        let a = this.m_thrust * Math.cos(degToRad(this.m_movementAngle));
        let b = this.m_thrust * Math.sin(degToRad(this.m_movementAngle));

        // breyta hraðanum með viðeigandi hraðabreytingu
        this.m_velX += b;
        this.m_velY -= a;

        // læsa hraðanum á X ás í annað hvort -m_maxVel eða m_maxVel
        // 0 er viljandi ekki haft með, annars myndi formið aldrei stoppa
        if(this.m_velX < 0)
        {
            if(this.m_velX < -this.m_maxVel)
            {
                this.m_velX = -this.m_maxVel
            }
        }
        else if(this.m_velX > 0)
        {
            if(this.m_velX > this.m_maxVel)
            {
                this.m_velX = this.m_maxVel
            }
        }

        // læsa hraðanum á Y ás í annað hvort -m_maxVel eða m_maxVel
        // 0 er viljandi ekki haft með, annars myndi formið aldrei stoppa
        if(this.m_velY < 0)
        {
            if(this.m_velY < -this.m_maxVel)
            {
                this.m_velY = -this.m_maxVel
            }
        }
        else if(this.m_velY > 0)
        {
            if(this.m_velY > this.m_maxVel)
            {
                this.m_velY = this.m_maxVel
            }
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

        // jafna hnitin ef þau skyldu vera kommutölur eftir hreyfinguna
        // (til að þau lendi á heilum pixel position hnitum)
        this.m_posX = Math.round(this.m_posX);
        this.m_posY = Math.round(this.m_posY);
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

        this.m_movementSpeed = playerSpeed;
        this.m_rotationSpeed = playerRotationSpeed;
        this.m_maxVel = playerMaxSpeed;

        this.m_posX = startX;
        this.m_posY = startY;

        this.m_drawFlame = false;

        //skipið
        this.m_points.push([ 0,-1.5]);
        this.m_points.push([ 1, 1.5]);
        this.m_points.push([ 0, 0.5]);
        this.m_points.push([-1, 1.5]);
        //"eldurinn"
        this.m_points.push([-0.5, 1  ]);
        this.m_points.push([ 0  , 1.5]);
        this.m_points.push([ 0.5, 1  ]);
        this.m_points.push([0,0.5]);
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
        // teikna fyrst skipið
        super.draw(this.m_points.slice(0,4));

        // og svo eldinn ef það á við
        if(this.m_drawFlame)
        {
            //context.save();
            //context.fillStyle = "yellow";
            super.draw(this.m_points.slice(4));
            //context.restore();
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

        // útlínur
        this.m_points.push([-0.5,-1.5]);
        this.m_points.push([0.5,-1.5]);
        this.m_points.push([1,-0.5]);
        this.m_points.push([2.5,0.5]);
        this.m_points.push([1,1.5]);
        this.m_points.push([-1,1.5]);
        this.m_points.push([-2.5,0.5]);
        this.m_points.push([-1,-0.5]);

        // miðjubútur til að fá línur þvert á skipið
        this.m_points.push([-2.5,0.5]);
        this.m_points.push([-1,-0.5]);
        this.m_points.push([1,-0.5]);
        this.m_points.push([2.5,0.5]);
    }

    draw()
    {
        // teiknað í tvennu lagi til að fá línurnar þvert á skipið
        super.draw(this.m_points.slice(0,8));
        super.draw(this.m_points.slice(8));
    }
}

// BigSaucer
// class fyrir stóra óvini
//
// erfir allt sem Saucer hefur
// 
// TODO - hegðun
class BigSaucer extends Saucer
{
    constructor(X,Y)
    {
        super(X,Y);
        this.m_scale = 1.25;
    }
}

// SmallSaucer
// class fyrir litla óvini
//
// erfir allt sem Saucer hefur
// 
// TODO - hegðun
class SmallSaucer extends Saucer
{
    constructor(X,Y)
    {
        super(X,Y);
        this.m_scale = 0.75;
    }
}

// hugsanlega sameina BigSaucer og SmallSaucer í Saucer og stilla stærðina í smiðnum

// Asteroid
// class fyrir asteroidin
//
// erfir allt sem Polygon hefur
//
// meðlimabreyta sem bætist við:
//   m_size -> stærð asteroidsins
//
// eins og er hreyfast þeir constant þar sem þeir kalla aldrei á thrust() fallið
// það er sennilega the way to go
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
        let tmpSize = Math.floor(Math.random()*2);
        if(tmpSize == 0)
        {
            this.m_size = 2;
        }
        else if (tmpSize == 1)
        {
            this.m_size = 5;
        }
        else
        {
            this.m_size = 8;
        }

        this.m_minrad = Math.round(this.m_size/3);

        this.m_points = [...randomShape(10,this.m_minrad,this.m_size)];
    }

    draw()
    {
        super.draw(this.m_points);
    }
}

// leikmannsbreyta, verður að vera neðan við skilgreininguna á Ship classanum
let player = new Ship(playerStartX,playerStartY);

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
// fall til að teikna stakan staf
// 
// letter -> stafur til að teikna, þarf að vera skilgreindur í font objectinu
//  X,  Y -> pixel position hnit á skjánum
function drawLetter(letter,X,Y)
{
    context.translate(0.5,0.5);
    if(letter == ':')
    {
        let X1 = font[letter][0][0][0];
        let Y1 = font[letter][0][0][1];
        let X2 = font[letter][0][1][0];
        let Y2 = font[letter][0][1][1];
        drawCircle(X1,Y1,X,Y);
        drawCircle(X2,Y2,X,Y);
    }
    else
    {
        for(let i = 0;i < font[letter].length;i++)
        {
            let X1 = font[letter][i][0][0];
            let Y1 = font[letter][i][0][1];
            let X2 = font[letter][i][1][0];
            let Y2 = font[letter][i][1][1];
            drawLine(X1,Y1,X2,Y2,X,Y);
        }
    }
    context.translate(-0.5,-0.5);
}

// drawCircle()
// fall til að teikna stakan radius 2 hring
//
//     X,     Y -> staðsetning hringsins í 2x3 grid, samskonar og font objectið notar
// drawX, drawY -> pixel position hnit á skjánum
function drawCircle(X,Y,drawX,drawY)
{
    context.save();
    context.fillStyle = 'white';

    context.beginPath();
    context.arc((X*grid)+drawX,(Y*grid)+drawY,2,0,2*Math.PI);
    context.fill();

    context.restore();
}

// drawLine()
// fall sem teiknar staka línu
//
//    X1,    Y1 -> upphafspunktur
//    X2,    Y2 -> endapunktur
// drawX, drawY -> pixel position hnit á skjánum
function drawLine(X1,Y1,X2,Y2,drawX,drawY)
{
    context.beginPath();
    context.moveTo((X1*grid)+drawX,(Y1*grid)+drawY);
    context.lineTo((X2*grid)+drawX,(Y2*grid)+drawY);
    context.stroke();
}
