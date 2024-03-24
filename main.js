/**
 * TODO:
 * bíða með að endurlífga leikmann þar til það er a.m.k. smá safe á miðjum skjá
 * auka líkur á litlum óvini eftir hver 10.000 stig
 * láta stóra fljúga random?
 * láta litla elta leikmann?
 * 
 * raða kóðanum betur í skránni
 * 
 * https://6502disassembly.com/va-asteroids/
 * 
 * */

/*******************************************************************************
*                              Upphaf keyrslunnar                              *
*******************************************************************************/

// canvasinn þar sem allir galdrarnir gerast
const canvas = document.getElementById('mainCanvas');
const context = canvas.getContext('2d');

// keyrslan byrjar svo hérna:
addEventListener("load",init_stuff);

// breyta til að geyma setInterval á main_loop fallinu
let runGame;

/*******************************************************************************
*                           fastar fyrir hitt og þetta                         *
*******************************************************************************/

// litirnir sem canvas föllin nota
const COLOR_FOREGROUND = "white";
const COLOR_BACKGROUND = "black";
const COLOR_HIGHLIGHT = "green";

// til að auðvelda læsileika í lyklaborðsföllum
const KEY_BACKSPACE = 8;
const KEY_ENTER = 13;
const KEY_SPACE = 32;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_A = 65;
const KEY_Z = 90;

// til að auðvelda læsileika í menu föllum
const MENU_MAIN = 0;
const MENU_HIGHSCORES = 1;
const MENU_ENTERNAME = 2;

// fjöldi á highscore listanum
const NUM_HIGHSCORES = 5;

// til að auðvelda læsileika í Asteroid klassa
const SMALL_ASTEROID = 0;
const MEDIUM_ASTEROID = 1;
const LARGE_ASTEROID = 2;

// hliðrun á X og Y ás á nýjum asteroid þegar öðrum er eytt
const ASTEROID_SPAWN_OFFSET = 15;

// hámarksfjöldi asteroid á skjá í einu
const MAX_ASTEROIDS = 27;

// tími í ms á milli sköpunar óvina
const ENEMY_SPAWN_INTERVAL = 20000;

// tími í ms á milli skota óvina
const ENEMY_SHOT_INTERVAL = 2500;

// fjöldi stjarna á bakgrunnsmynd
const NUM_STARS = 500;

// skölunarbreyta fyrir öll form/hluti
const GRID = 10;

// stærð á letri (með bili milli stafa og lína, hver stafur er 2x3 að stærð)
const FONT_WIDTH = 3 * GRID;
const FONT_HEIGHT = 4 * GRID;

// stig gefin fyrir að eyða asteroid
const SCORE_LARGE_ASTEROID = 20;
const SCORE_MEDIUM_ASTEROID = 50;
const SCORE_SMALL_ASTEROID = 100;

// stig gefin fyrir að eyða óvinum
const SCORE_BIG_ENEMY = 200;
const SCORE_SMALL_ENEMY = 1000;

// stigafjöldi sem gefur aukalíf
const SCORE_EXTRA_LIFE = 10000;

// upphafsstaða leikmanns
const PLAYER_START_X = (canvas.width/2)+1;
const PLAYER_START_Y = (canvas.height/2)+1;

// hröðun og hámarkshraði leikmanns (px per frame)
const PLAYER_ACCELERATION = 0.3;
const PLAYER_MAX_VELOCITY = 6;

// núningur á hraða leikmanns (px per frame)
// hægir á honum og stöðvar hann
const PLAYER_DRAG = 0.025;

// snúningshraði leikmanns (gráður per frame)
const PLAYER_ROTATION_SPEED = 5;

// upphafsfjöldi aukalífa
const PLAYER_START_LIVES = 4;

// tími í ms sem leikmaður bíður áður en hann vaknar aftur til lífsins
const PLAYER_DEAD_TIME = 1000;

// töf í ms milli skota leikmanns
const PLAYER_BULLET_DELAY = 200;

// töf í ms milli notkunar hyperspace
const HYPERSPACE_DELAY = 150;

// hámarksfjöldi kúla á skjá í einu
const MAX_BULLETS = 4;

// hraði kúlanna (px per frame)
const BULLET_VELOCITY = 7;

// hámarkslíftími kúlanna í ms
// -1 lætur þær lifa að eilífu
const BULLET_MAX_AGE = -1; // 1500 var gamla gildið

// stærð kúlanna, notað beint sem radíus í context.arc() kalli
const BULLET_RADIUS = 2;

// ræður því hvort "klassísku" formin á leikmanni og loftsteinum séu notuð
const DO_CLASSIC_SHAPES = true;

// rammar á sekúndu sem reynt er að takmarka
// leikinn í svo hann gangi ekki of hratt
const FPS = 60;

// key fyrir localStorage geymsluna á highscore listanum
const LSKEY = "AsteroidScores";

// hljóð
const audioShoot = new Audio();
const audioThrust = new Audio();
const audioExplosionSmall = new Audio();
const audioExplosionMedium = new Audio();
const audioExplosionLarge = new Audio();

/*******************************************************************************
*                             breytur fyrir ýmsa hluti                         *
*******************************************************************************/

// breytur sem geyma timestamp á hlutum sem virkjast með lyklaborði
// notaðar til að koma í veg fyrir að hlutirnir keyrist oftar en einu sinni í einu
let lastHyperspaceTime;
let playerLastShotTime;

// breytur til að stýra tímasetningum á óvinum
let lastEnemySpawn = 0;
let lastEnemyShot = 0;

// geymir staðsetningu leikmannsins í gameObjects fylkinu
// hann er alltaf fyrsta stakið þar sem hann er stofnaður í
// init_stuff() fallinu sem keyrir á undan öllu hinu
let playerIndex = 0;

// geymir upplýsingar um það hvaða takkar á lyklaborðinu eru niðri/uppi
// true == niðri
// false == uppi
let keys = {
    KEY_LEFT: false,
    KEY_RIGHT: false,
    KEY_UP: false,
    KEY_DOWN: false,
    KEY_SPACE: false,
    KEY_ENTER: false,
    KEY_Z: false
};

// varðveisla á bakgrunnsmynd
let generatedBackground = false;
let storedBackground;

/*******************************************************************************
*                           Breytur tengdar valmyndum                          *
*******************************************************************************/

// heldur utan um það hvaða valmynd er virk
let currentMenu = MENU_MAIN;

// heldur utan um það hvort atburðahlustararnir fyrir valmyndina sé virkir
let menuListenersActive = false;

// titlarnir á valmyndunum
let mainMenuTitle = "ASTEROIDS";
let gameOverTitle = "GAME OVER";
let highscoresTitle = "HIGH SCORES";

// valmöguleikar í valmyndum
let mainMenuItems = ["NEW GAME","HIGH SCORES"];
let highscoresMenuItems = ["BACK","RESET SCORES"];

// texti í game over valmynd
let oneOfTheBest1Text = "YOUR SCORE IS ONE";
let oneOfTheBest2Text = "OF THE BEST";
let enterNameText = "ENTER YOUR INITIALS:";

// leiðbeiningar á aðalvalynd
let controls1Text = "TURN: LEFT AND RIGHT ARROWS";
let controls2Text = "THRUST: UP ARROW";
let controls3Text = "SHOOT: SPACE";
let controls4Text = "PRESS Z TO GO INTO HYPERSPACE";

// fylki sem halda utan um það hvaða valmöguleika músin er yfir í valmyndunum
let mainMenuMouseOver = [];
let highscoresMenuMouseOver = [];

// breyta fyrir innslátt á nafni
let highscoreName = "";

// breyta sem verður að eintaki af Highscores klassanum
let highscores;

/*******************************************************************************
*                Breytur tengdar keyrslu spilunarhluta leiksins                *
*******************************************************************************/

// hvaða "bylgja" af asteroid er í gangi
// (hækkar strax um 1 þannig að hún telur í raun frá 1)
let waveNumber = 0;

// fylki til að geyma hlutina sem eru til staðar í leiknum
let gameObjects = [];

// breytur til að halda utanum fjölda hluta
let numBullets = 0;
let numEnemies = 0;
let numAsteroids = 0;

/*******************************************************************************
*                               Atburðahöndlarar                               *
*******************************************************************************/

// keydown()
// atburðahöndlari fyrir keydown atburði
//
// merkir við takka sem er ýtt niður svo að handle_keys() viti hvað á að gera
function keydown(event)
{
    if(event.keyCode == KEY_LEFT || event.keyCode == KEY_RIGHT ||
       event.keyCode == KEY_UP   || event.keyCode == KEY_SPACE ||
       event.keyCode == KEY_Z)
    {
        keys[event.keyCode] = true;
    }
}

// keyup()
// atburðahöndlari fyrir keyup atburði
//
// merkir við takka sem er sleppt svo að handle_keys() viti hvað á ekki að gera
function keyup(event)
{
    if(event.keyCode == KEY_LEFT || event.keyCode == KEY_RIGHT ||
       event.keyCode == KEY_UP   || event.keyCode == KEY_SPACE ||
       event.keyCode == KEY_Z)
    {
        keys[event.keyCode] = false;
    }
}

// menu_entering_text()
// atburðahöndlari fyrir textainnslátt í valmynd
//
// einungis notaður til að taka við nafni fyrir highscores
function menu_entering_text(event)
{
    if(event.keyCode == KEY_BACKSPACE)
    {
        // hindra vafrann í að fara til baka
        event.preventDefault();

        // klippa aftasta stafinn af nafninu
        if(highscoreName.length > 0)
        {
            highscoreName = highscoreName.substring(0,highscoreName.length-1);
        }
    }

    // takmarka stafasett í A-Z
    if(event.keyCode >= KEY_A && event.keyCode <= KEY_Z)
    {
        // takmarka lengd nafns í 3 stafi
        if(highscoreName.length < 3)
        {
            highscoreName = "".concat(highscoreName,event.key.toUpperCase());
        }
    }

    if(event.keyCode == KEY_ENTER)
    {
        // setja stigin og nafnið í highscores objectið
        highscores.insert(highscoreName,gameObjects[playerIndex].m_playerScore);

        // núlla nafnið og birta stigalistann
        highscoreName = "";
        currentMenu = MENU_HIGHSCORES;

        // hlustarinn fjarlægir svo sjálfan sig eftir notkun
        document.removeEventListener("keydown",menu_entering_text);
    }
}

// menu_mouse_move()
// atburðahöndlari fyrir músarhreyfingar í valmynd
//
// athugar hvort músin sé yfir einhverjum valmöguleika
function menu_mouse_move(event)
{
    // engin mús í innsláttarvalmynd
    if(currentMenu == MENU_ENTERNAME)
    {
        return;
    }

    // sækja músahnitin
    let mouseX = event.pageX - this.offsetLeft;
    let mouseY = event.pageY - this.offsetTop;

    // tímabundin fylki til að forðast endurtekningu á kóða
    let optionArray = [];
    let mouseOverArray = [];

    //upphafsgildi á Y, sameiginlegur þáttur úr Y útreikningum fyrir báðar valmyndirnar
    let startY = -((FONT_HEIGHT/2)+GRID)

    // stillir Y gildin og velur fylki eftir því hvaða valmynd er valin
    switch(currentMenu)
    {
        case MENU_MAIN:
            startY += centered_text_y_coord(mainMenuItems.length)
            optionArray = mainMenuItems;
            mouseOverArray = mainMenuMouseOver;
            break;
        case MENU_HIGHSCORES:
            startY += centered_text_y_coord(highscoresMenuItems.length) + (canvas.width/4) - (2*GRID) - 1;
            optionArray = highscoresMenuItems;
            mouseOverArray = highscoresMenuMouseOver;
            break;
    }

    // fara í gegnum valmöguleikanna í valmyndinni sem varð fyrir valinu
    for(let i = 0; i < optionArray.length; i++)
    {
        // merkja alla valmöguleika fyrst sem óvirka
        mouseOverArray[i] = false;

        // smíða kassa sem nær yfir valmöguleikann
        let targetX = centered_text_x_coord(optionArray[i])+1;
        let targetW = ((optionArray[i].length)*FONT_WIDTH)-GRID;
        let targetY = startY+1;
        let targetH = FONT_HEIGHT-GRID;

        // debug box
        //context.save();
        //context.strokeStyle = COLOR_HIGHLIGHT;
        //context.rect(targetX,targetY,targetW,targetH);
        //context.stroke();
        //context.restore();

        // athuga hvort það sé árekstur á milli músarinnar og kassans
        let hitTarget = collision_point_to_rectangle(mouseX,mouseY,targetX,targetY,targetW,targetH);

        // ef það var árekstur
        if(hitTarget == true)
        {
            // þá merkjum við þennan möguleika sem valinn
            mouseOverArray[i] = true;
        }

        // og förum í næstu línu
        startY += FONT_HEIGHT;
    }
}

// menu_mouse_up()
// atburðahöndlari fyrir slepptan músartakka í valmynd
//
// athugar hvort menu_mouse_move() hafi merkt við
// einhvern valmöguleiga og virkjar hann ef svo er
function menu_mouse_up(event)
{
    // engin mús í innsláttarvalmynd
    if(currentMenu == MENU_ENTERNAME)
    {
        return;
    }

    // leitar að völdum valmöguleika í virku valmyndinni
    // þeir eru stilltir í mouse move hlustaranum
    // keyrir svo virkni viðkomandi valmöguleika
    switch(currentMenu)
    {
        case MENU_MAIN:
            for(let i = 0; i < mainMenuMouseOver.length; i++)
            {
                if(mainMenuMouseOver[i] == true)
                {
                    main_menu_select(i);
                    return;
                }
            }
            break;
        case MENU_HIGHSCORES:
            for(let i = 0; i < highscoresMenuMouseOver.length; i++)
            {
                if(highscoresMenuMouseOver[i] == true)
                {
                    highscores_menu_select(i);
                    return;
                }
            }
            break;
    }
}

/*******************************************************************************
* Föll *
*******************************************************************************/

// activate_menu_listeners()
// virkjar atburðahlustara fyrir músina í valmyndunum
function activate_mouse_listeners()
{
    menuListenersActive = true;
    canvas.addEventListener("mouseup",menu_mouse_up);
    canvas.addEventListener("mousemove",menu_mouse_move);
}

// deactivate_menu_listeners()
// fjarlægir atburðahlustara fyrir músina í valmyndunum
function deactivate_mouse_listeners()
{
    menuListenersActive = false;
    canvas.removeEventListener("mouseup",menu_mouse_up);
    canvas.removeEventListener("mousemove",menu_mouse_move);
}

// play_audio()
// spilar hljóðskrá frá byrjun
//
//   audio -> hljóðskrá sem á að spila
function play_audio(audio)
{
    audio.currentTime = 0;
    audio.play();
}

// init_stuff()
// stillir það sem þarf að stilla í upphafi og setur svo aðallykkju í gang
function init_stuff()
{
    // núllstilla skeiðklukkur
    lastHyperspaceTime = timestamp_now();
    playerLastShotTime = timestamp_now();

    //default stillingar á canvas teikningunum
    context.strokeStyle = COLOR_FOREGROUND;
    context.fillStyle = COLOR_BACKGROUND;
    context.lineWidth = 1;

    // virkja atburðahlustara fyrir lyklaborð
    document.addEventListener("keydown",keydown);
    document.addEventListener("keyup",keyup);

    // opna hljóðskrárnar
    audioShoot.src = "sounds/shoot.wav";
    audioThrust.src = "sounds/thrustlong.wav";
    audioThrust.loop = true;
    audioExplosionSmall.src = "sounds/explosion_small.wav";
    audioExplosionMedium.src = "sounds/explosion_medium.wav";
    audioExplosionLarge.src = "sounds/explosion_large.wav";

    // núllstilla "hover" fylkið fyrir valmyndirnar
    for(let i = 0; i < mainMenuItems.length;i++)
    {
        mainMenuMouseOver.push(false);
    }
    for(let i = 0; i < highscoresMenuItems.length;i++)
    {
        highscoresMenuMouseOver.push(false);
    }

    // stofna eintak af Highscores klassanum og koma gögnum í hann
    highscores = new Highscores();
    highscores.load();

    // virkja atburðahlustara fyrir valmyndina
    activate_mouse_listeners();

    // stofna leikmanninn
    gameObjects.push(new Player(PLAYER_START_X,PLAYER_START_Y));

    // keyra aðallykkjuna eins oft og FPS fastinn segir að þurfi
    runGame = setInterval(main_loop,(1000/FPS));
}

// timestamp_now()
// skilar út timestamp í ms síðan á miðnætti 1. janúar 1970 (UTC)
function timestamp_now()
{
    return performance.timeOrigin + performance.now();
}

// main_loop()
// fall sem hýsir aðallykkju leiksins
function main_loop()
{
    // input höndlun fyrst
    handle_keys();

    // athuga hvort það þurfi að búa til hluti
    spawn_asteroids();
    spawn_enemies();

    // síðan hreyfingar og snúningar
    move_polygons(gameObjects);
    rotate_polygons(gameObjects);

    enemies_shoot(gameObjects);

    //skoða árekstra
    collide_polygons(gameObjects);

    // Hreinsa til eftir árekstra
    cleanup_polygons(gameObjects);

    //og að lokum teikna allt sem þarf
    draw_background();
    draw_polygons(gameObjects);
    draw_score();
    draw_lives();

    // ef leikmaður er búinn að tapa þá þarf að birta valmynd
    if(gameObjects[playerIndex].is_gameover() == true)
    {
        // það þarf að geta tekið við músarhreyfingu og smellum
        if(menuListenersActive == false)
        {
            activate_mouse_listeners();
        }

        // ef leikmaður er nýbúinn að tapa
        if(gameObjects[playerIndex].m_justLostGame == true)
        {
            // kanna hvort stigin hans komist á highscore listann
            if(highscores.is_high(gameObjects[playerIndex].m_playerScore) == true)
            {
                // virkja valmyndina sem leyfir nafnainnslátt fyrir highscore
                currentMenu = MENU_ENTERNAME;
                document.addEventListener("keydown",menu_entering_text);
            }
            // hindra að þessi if block keyrist aftur
            gameObjects[playerIndex].m_justLostGame = false;
        }
        draw_menu();
    }
    else// ef leikmaður er ekki búinn að tapa
    {
        // pössum að músin sé ekki virk
        if(menuListenersActive == true)
        {
            deactivate_mouse_listeners();
        }
    }

    //draw_debug_cross();
}

function enemies_shoot(array)
{
    let shot = false;

    if(array.length > 0)
    {
        for(let i = 0; i < array.length; i++)
        {
            if(array[i] instanceof BigEnemy || array[i] instanceof SmallEnemy)
            {
                let timeSinceLastShot = timestamp_now()-lastEnemyShot;
                if(timeSinceLastShot > ENEMY_SHOT_INTERVAL)
                {
                    shot = true;
                    array[i].shoot();
                }
            }
        }
    }

    if(shot == true)
    {
        lastEnemyShot = timestamp_now();
    }
}

// restart_game()
// núllstillir leikinn og byrjar upp á nýtt
function restart_game()
{
    // tæma allt úr gameObjects fyrir utan leikmanninn
    gameObjects = [...[gameObjects[playerIndex]]];
    numAsteroids = 0;
    numBullets = 0;
    numEnemies = 0;

    // núllstilla leikmanninn og vekja hann frá dauðum
    gameObjects[playerIndex].reset();

    // byrja aftur á fyrstu "bylgju"
    waveNumber = 0;

    // slökkva á atburðahlusturunum fyrir valmyndina
    if(menuListenersActive == true)
    {
        deactivate_mouse_listeners();
    }

    // passa að leikurinn viti af því að hann sé byrjaður
    //gameStarted = true;
}

// draw_menu()
// keyrir teiknifallið fyrir valmyndina sem er valin
function draw_menu()
{
    switch(currentMenu)
    {
        case MENU_MAIN:
            draw_main_menu();
            break;
        case MENU_HIGHSCORES:
            draw_highscores_menu();
            break;
        case MENU_ENTERNAME:
            draw_entername_menu();
            break;
    }
}

// draw_highscores_menu()
// teiknar valmyndina sem birtir hæstu stigaskorin
function draw_highscores_menu()
{
    let logoX = centered_text_x_coord(highscoresTitle);
    let logoY = centered_text_y_coord() - (canvas.height/4) - (2*GRID);

    draw_text(highscoresTitle,logoX,logoY);

    let longestScoreString = "".concat(highscores.m_data.names[0].toString()," ",highscores.m_data.scores[0].toString());
    let longestScoreDigits = longestScoreString.length - 4;

    let scoresX = centered_text_x_coord(longestScoreString);
    let scoresY = centered_text_y_coord(NUM_HIGHSCORES);

    for(let i = 0; i < NUM_HIGHSCORES;i++)
    {
        let tmpText = "".concat(highscores.m_data.names[i].toString()," ",highscores.m_data.scores[i].toString().padStart(longestScoreDigits,' '));
        draw_text(tmpText,scoresX,scoresY);
        scoresY += FONT_HEIGHT;
    }

    let optionsX;
    let optionsY = centered_text_y_coord(highscoresMenuItems.length) + (canvas.height/4) + (highscoresMenuItems.length*(2*GRID));

    for(let i = 0; i < highscoresMenuItems.length;i++)
    {
        optionsX = centered_text_x_coord(highscoresMenuItems[i]);
        let color = highscoresMenuMouseOver[i] == true ? COLOR_HIGHLIGHT : COLOR_FOREGROUND;
        draw_text(highscoresMenuItems[i],optionsX,optionsY,color);

        optionsY += FONT_HEIGHT;
    }
}

// centered_text_x_coord()
// tekur inn textastreng og skilar úr X gildi sem
// hægt er að nota til að teikna viðkomandi texta
// á miðjum skjánum
function centered_text_x_coord(text)
{
    return (canvas.width/2) - (text.length*FONT_WIDTH/2) + (GRID/2);
}

// centered_text_y_coord()
// skilar út Y gildi til að teikna línur af texta á miðjum skjánum
function centered_text_y_coord(lines = 1)
{
    return (canvas.height/2) - (((lines-1)*FONT_HEIGHT)/2) + ((FONT_HEIGHT-GRID)/2);
}

// draw_main_menu()
// teiknar aðalvalmyndina
function draw_main_menu()
{
    let topTextX = centered_text_x_coord(mainMenuTitle);
    let topTextY = centered_text_y_coord() - canvas.height/4;
    draw_text(mainMenuTitle,topTextX,topTextY);

    let itemX = 0;
    let itemY = centered_text_y_coord(mainMenuItems.length);

    for(let i = 0; i < mainMenuItems.length; i++)
    {
        itemX = centered_text_x_coord(mainMenuItems[i]);
        let color = mainMenuMouseOver[i] == true ? COLOR_HIGHLIGHT : COLOR_FOREGROUND;
        draw_text(mainMenuItems[i],itemX,itemY,color);
        itemY += FONT_HEIGHT;
    }

    let controls1X = centered_text_x_coord(controls1Text);
    let controls2X = centered_text_x_coord(controls2Text);
    let controls3X = centered_text_x_coord(controls3Text);
    let controls4X = centered_text_x_coord(controls4Text);
    let controlsY = centered_text_y_coord(4) + canvas.height/4;

    draw_text(controls1Text,controls1X,controlsY);
    controlsY += FONT_HEIGHT;
    draw_text(controls2Text,controls2X,controlsY);
    controlsY += FONT_HEIGHT;
    draw_text(controls3Text,controls3X,controlsY);
    controlsY += FONT_HEIGHT;
    draw_text(controls4Text,controls4X,controlsY);
}

// draw_entername_menu()
// teiknar "game over" valmyndina svo notandi geti
// slegið inn nafn fyrir highscore listann
function draw_entername_menu()
{
    let X = centered_text_x_coord(gameOverTitle);
    let Y = centered_text_y_coord() - canvas.height/4;
    draw_text(gameOverTitle,X,Y);

    X = centered_text_x_coord(oneOfTheBest1Text);
    Y = centered_text_y_coord(2);
    draw_text(oneOfTheBest1Text,X,Y);
    X = centered_text_x_coord(oneOfTheBest2Text);
    Y += FONT_HEIGHT;
    draw_text(oneOfTheBest2Text,X,Y);

    let enterText = "".concat(highscoreName,"_");
    X = centered_text_x_coord(enterNameText);
    Y = centered_text_y_coord(2) + canvas.height/4;
    draw_text(enterNameText,X,Y);
    X = centered_text_x_coord(enterText);
    Y += FONT_HEIGHT;
    draw_text(enterText,X,Y);
}

// draw_debug_cross()
// teiknar krossa yfir skjáinn til að aðstoða við staðsetningu á hlutum
function draw_debug_cross()
{
    context.save();

    context.translate(0.5,0.5);

    context.strokeStyle = COLOR_FOREGROUND;
    context.beginPath();
    context.moveTo(0,canvas.height/2);
    context.lineTo(canvas.width-1,canvas.height/2);
    context.stroke();
    context.beginPath();
    context.moveTo(canvas.width/2,0);
    context.lineTo(canvas.width/2,canvas.height-1);
    context.stroke();

    context.strokeStyle = COLOR_HIGHLIGHT;
    context.beginPath();
    context.moveTo(0,canvas.height/4);
    context.lineTo(canvas.width-1,canvas.height/4);
    context.stroke();
    context.beginPath();
    context.moveTo(canvas.width/4,0);
    context.lineTo(canvas.width/4,canvas.height-1);
    context.stroke();

    context.beginPath();
    context.moveTo(0,canvas.height/4+(canvas.height/2));
    context.lineTo(canvas.width-1,canvas.height/4+(canvas.height/2));
    context.stroke();
    context.beginPath();
    context.moveTo(canvas.width/4+(canvas.width/2),0);
    context.lineTo(canvas.width/4+(canvas.width/2),canvas.height-1);
    context.stroke();

    context.translate(-0.5,-0.5);

    context.restore();
}

// main_menu_select()
// virkjar valmöguleika úr aðalvalmyndinni
//
//   option -> valmöguleikinn sem verið er að virkja
function main_menu_select(option)
{
    switch(option)
    {
        case 0://NEW GAME
            restart_game();
            break;
        case 1://HIGH SCORES
            currentMenu = MENU_HIGHSCORES;
            break;
    }
}

// highscores_menu_select()
// virkjar valmöguleika úr valmyndinni sem birtir highscore listann
//
//   option -> valmöguleikinn sem verið er að virkja
function highscores_menu_select(option)
{
    switch(option)
    {
        case 0://BACK
            currentMenu = MENU_MAIN;
            break;
        case 1://RESET SCORES
            highscores.reset();
            break;
    }
}

// spawn_asteroids()
// býr til nýja asteroid ef leikmaður nær að eyða öllum
//
// Fjöldinn fer eftir því hvaða eru búnar margar "bylgjur" af asteroidum
// Bylgja 1: 4
// Bylgja 2: 6
// Bylgja 3: 8
// Bylgja 4: 10
// Bylgja 5+: 11
function spawn_asteroids()
{
    if(numAsteroids == 0)
    {
        waveNumber++;

        let numberToSpawn = 4;

        if(waveNumber < 5)
        {
            numberToSpawn += ((waveNumber-1)*2);
        }
        else
        {
            numberToSpawn = 11;
        }

        for(let i = 0; i < numberToSpawn; i++)
        {
            let randomLocation = random_coordinates(true);
            create_asteroid(randomLocation[0],randomLocation[1],LARGE_ASTEROID);
        }
    }
}

// spawn_enemies()
// býr til nýja óvini á X fresti
function spawn_enemies()
{
    let timeSinceLastEnemy = timestamp_now()-lastEnemySpawn;
    if(timeSinceLastEnemy > ENEMY_SPAWN_INTERVAL)
    {
        lastEnemySpawn = timestamp_now();
        let coords = random_coordinates(true);

        let randomNumber = random_number_range(1,100);
        if(randomNumber >= 1 && randomNumber <= 75)
        {
            gameObjects.push(new BigEnemy(coords[0],coords[1]));
        }
        else
        {
            gameObjects.push(new SmallEnemy(coords[0],coords[1]));
        }
    }
}

// create_asteroid()
// býr til nýtt asteroid af gefinni stærð á gefnum stað
//
// passar að það séu ekki of mörg á skjánum í einu
function create_asteroid(X,Y,size)
{
    if(numAsteroids < MAX_ASTEROIDS)
    {
        gameObjects.push(new Asteroid(X,Y,size));
    }
}

// random_coordinates()
// býr til random pixel skjáhnit
//
//   safe -> ákvarðar hvort hnitin verði í öruggri fjarlægð frá leikmanni
function random_coordinates(safe = false)
{
    let X = Math.floor(Math.random()*(canvas.width-1));
    let Y = Math.floor(Math.random()*(canvas.height-1));

    let playerX = gameObjects[playerIndex].m_posX;
    let playerY = gameObjects[playerIndex].m_posY;

    let A = Math.abs(X-playerX);
    let B = Math.abs(Y-playerY);
    let distanceToPlayer = Math.sqrt((A*A)+(B*B));

    if(safe == true)
    {
        while(distanceToPlayer <= 200)
        {
            X = Math.floor(Math.random()*(canvas.width-1));
            Y = Math.floor(Math.random()*(canvas.height-1));

            A = Math.abs(X-playerX);
            B = Math.abs(Y-playerY);
            distanceToPlayer = Math.sqrt((A*A)+(B*B));
        }
    }

    return [X,Y];
}

// draw_score()
// teiknar stigin sem leikmaður er kominn með
function draw_score()
{
    draw_text(gameObjects[playerIndex].m_playerScore.toString(),5,35);
}

// draw_lives()
// teiknar lífin sem leikmaður á eftir
function draw_lives()
{
    if(gameObjects[playerIndex].m_playerLives > 0)
    {
        let tmpShip = new Ship(0,60);
        for(let i = 0; i < gameObjects[playerIndex].m_playerLives; i++)
        {
            tmpShip.m_posX = (i*2.5*GRID)+20;
            tmpShip.draw();
        }
    }
}

// handle_keys()
// bregst við eftir því sem við á ef takki á lyklaborði er niðri/uppi
function handle_keys()
{
    let tmpCoords;

    if(keys[KEY_LEFT] == true)
    {
        gameObjects[playerIndex].rotate(-gameObjects[playerIndex].m_rotationSpeed);
    }

    if(keys[KEY_RIGHT] == true)
    {
        gameObjects[playerIndex].rotate(gameObjects[playerIndex].m_rotationSpeed);
    }

    if(keys[KEY_UP] == true)
    {
        if(gameObjects[playerIndex].is_alive() == true)
        {
            gameObjects[playerIndex].thrust();
            audioThrust.play();
        }
    }
    else
    {
        gameObjects[playerIndex].thrust(0);
        audioThrust.pause();
        audioThrust.currentTime = 0;
    }

    if(keys[KEY_SPACE] == true &&
       (timestamp_now()-playerLastShotTime) >= PLAYER_BULLET_DELAY)
    {
        playerLastShotTime = timestamp_now();

        gameObjects[playerIndex].shoot();
    }

    // hyperspace, flytur leikmann á random stað á skjánum
    // smá líkur á að það fari úrskeiðis og leikmaður deyi
    // TODO - láta þennan atburðahlustara "virkja" hyperspace stökkið
    //        til að geta beðið þangað til það er öruggt að koma úr
    //        hyperspace stökkinu
    if(keys[KEY_Z] == true)
    {
        if(timestamp_now() - lastHyperspaceTime > HYPERSPACE_DELAY)
        {
            let jumpFailed = false;

            // smíða random tölu frá 0-31
            let randomNumber = Math.floor(Math.random()*31);

            // 24-31 == dauði (25% líkur)
            if(randomNumber >= 24 && randomNumber <= 31)
            {
                jumpFailed = true;
            }

            // breyta tölunni í 0-7
            randomNumber &= 7;

            // bæta svo við 4
            randomNumber += 4;

            // ef talan er núna lægri en fjöldi asteroida á skjánum
            // þá deyr leikmaðurinn
            if(randomNumber < numAsteroids)
            {
                jumpFailed = true;
            }

            if(jumpFailed == true)
            {
                gameObjects[playerIndex].die();
            }
            else
            {
                lastHyperspaceTime = timestamp_now();
                tmpCoords = random_coordinates();
                gameObjects[playerIndex].m_posX = tmpCoords[0];
                gameObjects[playerIndex].m_posY = tmpCoords[1];
            }
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
        context.clearRect(0,0,canvas.width,canvas.height);
        context.beginPath();
        context.rect(0,0,canvas.width,canvas.height);
        context.fill();

        // búa til random stjörnur
        for(let i = 0; i < NUM_STARS;i++)
        {
            let sX = Math.floor(Math.random()*(canvas.width-1));
            let sY = Math.floor(Math.random()*(canvas.height-1));
            context.fillStyle = COLOR_FOREGROUND;
            context.fillRect(sX,sY,1,1);
        }
        context.fillStyle = COLOR_BACKGROUND;

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

// random_shape()
// fall sem býr til handahófskennt form
// það fer í hring og býr til punkta
//
// nodes -> fjöldi punkta á hringnum
//  minR -> lægsti mögulegi radíus
//  maxR -> hæsti mögulegi radíus
//
// skilar frá sér fylki af fylkjum með X,Y hnitum
// t.d. [[x,y],[x2,y2],[x3,y3]]
// (ekki pixel hnitum, þau eru seinna sköluð upp með grid breytunni)
function random_shape(nodes,minR,maxR)
{
    // reikna hornið milli punkta út frá fjölda
    let angleStep = (Math.PI * 2) / nodes;

    let tmpRet = [];
    let x, y;

    for(let i = 0;i < nodes;i++)
    {
        // lykkja sem býr til ný hnit
        // keyrir þangað til það verða til hnit sem eru ekki í fylkinu
        do
        {
            let targetAngle = angleStep * i;
            let angle = targetAngle + (Math.random() - 0.75) * angleStep * 0.5;
            let radius = minR + Math.random() * (maxR-minR);
            x = Math.round(Math.round((Math.cos(angle) * radius) * GRID)/GRID);
            y = Math.round(Math.round((Math.sin(angle) * radius) * GRID)/GRID);
        }
        while(is_XY_in_array(x,y,tmpRet));

        tmpRet.push([x,y]);
    }

    return tmpRet;
}

// is_XY_in_array()
// athugar hvort hnit séu þegar til staðar í fylki
//
// tx, ty -> hnit
// tmpRet -> fylki
function is_XY_in_array(tx,ty,tmpRet)
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

// deg_to_rad()
// breytir gráðum í radíana
//
// a -> gráður
function deg_to_rad(a)
{
    return a * (Math.PI/180);
}

// rotate_coordinates()
// snýr XY hnitum um eitthvað horn
// 
// [X,Y] -> fylki með hnitunum
// angle -> hornið í gráðum
function rotate_coordinates([X,Y],angle)
{
    let nX = X*Math.cos(deg_to_rad(angle))-Y*Math.sin(deg_to_rad(angle));
    let nY = X*Math.sin(deg_to_rad(angle))+Y*Math.cos(deg_to_rad(angle));
    return [nX,nY];
}

// random_number_range()
// býr til tölu af handahófi innan ákveðins bils
//
//   min -> lágmarksgildi
//   max -> hámarksgildi
function random_number_range(min,max)
{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random()*(max-min+1))+min;
}

/******************************************************************************/

// draw_text()
// fall sem teiknar textastreng
//
// text -> textastrengurinn
// X, Y -> pixel hnit á skjánum
// color -> litur
function draw_text(text,X,Y,color = COLOR_FOREGROUND)
{
    // fonturinn hefur enga litla stafi
    text = text.toUpperCase();

    for(let i = 0; i < text.length;i++)
    {
        let charCode = text.charCodeAt(i);
        if((charCode >= 48 && charCode <= 58) ||
           (charCode >= 65 && charCode <= 90) || charCode == 95)
        {
            draw_letter(text.charAt(i),X+(i*FONT_WIDTH),Y,color);
        }
    }
}

// draw_letter()
// fall til að teikna stakan staf. Stafir sem eru ekki skilgreindir í font
// objectinu teiknast sem bil
// 
// letter -> stafur til að teikna
//  X,  Y -> pixel hnit á skjánum
// color -> litur
function draw_letter(letter,X,Y,color = COLOR_FOREGROUND)
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
        draw_font_circle(X1,Y1,X,Y,color);
        draw_font_circle(X2,Y2,X,Y,color);
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
            draw_font_line(X1,Y1,X2,Y2,X,Y,color);
        }
    }

    // hliðra hnitunum á canvasnum til baka svo að allt hitt verði ekki blurry
    context.translate(-0.5,-0.5);
}

// draw_circle()
// fall til að teikna stakan radius 2 hring
//
//     X,     Y -> staðsetning hringsins í 2x3 grid, sama hnitakerfi og fontur
// drawX, drawY -> pixel hnit á skjánum
// color -> litur
function draw_font_circle(X,Y,drawX,drawY,color = COLOR_FOREGROUND)
{
    // geyma teiknistillingarnar á canvasnum
    context.save();

    context.fillStyle = color;

    context.beginPath();
    context.arc((X*GRID)+drawX,(Y*GRID)+drawY,2,0,2*Math.PI);
    context.fill();

    // sækja geymdu teiknistillingarnar á canvasnum
    context.restore();
}

// draw_line()
// fall sem teiknar staka línu
//
//    X1,    Y1 -> upphafspunktur, 2x3 grid
//    X2,    Y2 -> endapunktur, 2x3 grid
// drawX, drawY -> pixel hnit á skjánum
// color -> litur
function draw_font_line(X1,Y1,X2,Y2,drawX,drawY,color = COLOR_FOREGROUND)
{
    context.save();
    context.strokeStyle = color;
    context.beginPath();
    context.moveTo((X1*GRID)+drawX,(Y1*GRID)+drawY);
    context.lineTo((X2*GRID)+drawX,(Y2*GRID)+drawY);
    context.stroke();
    context.restore();
}

/*******************************************************************************
*        Utility föll fyrir safn af Polygon klösum (gameObjects fylkið)        *
*******************************************************************************/

// check_collisions()
// fer í gegnum fylki af Polygon klösum og keyrir árekstraprófun á þeim
//
// TODO: gera þetta meira efficient með sparse grid eða octree?
//       (virðist vera óþarfi þar sem þetta hægir ekki á leiknum)
function collide_polygons(array)
{
    if(array.length > 0)
    {
        for(let i = 0; i < array.length;i++)
        {
            for(let j = 0; j < array.length;j++)
            {
                if(array[i].check_collision(array[j]) == true)
                {
                    array[i].collided_with(array[j]);
                    array[j].collided_with(array[i]);
                }
            }
        }
    }
}

// cleanup_polygons()
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
                if(array[i] instanceof Asteroid)
                {
                    numAsteroids--;
                }
                if(array[i] instanceof BigEnemy || array[i] instanceof SmallEnemy)
                {
                    numEnemies--;
                }
                if(array[i] instanceof Bullet)
                {
                    numBullets--;
                }

                array.splice(i,1);
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
// fall sem fer í gegnum fylki af Polygon klösum og keyrir rotate() fallið
// þeirra. Sleppir því ef um leikmanninn er að ræða þar sem hann sér sjálfur um
// að snúa sér
//
// array -> fylki af Polygon klösum
function rotate_polygons(array)
{
    if(array.length > 0)
    {
        for(let i = 0; i < array.length;i++)
        {
            if((array[i] instanceof Player) == false)
            {
                array[i].rotate();
            }
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

/*******************************************************************************
*                                   Klassar                                    *
*******************************************************************************/

// Highscores
// klassi sem heldur utanum highscores og sækir/geymir þau í localStorage
//
// meðlimabreyta:
//   m_data -> object með 2 fylkjum fyrir stig og nöfn
//
// meðlimaföll:
//   load() -> sækir m_data í localStorage
//   save() -> geymir m_data í localStorage
//   reset() -> núllstillir og keyrir save()
//   is_high() -> true/false eftir því hvort stigaskorið nái á listann
//   insert() -> setur stig inn í listann á réttan stað og hliðrar honum eftir þörfum
class Highscores
{
    constructor()
    {
        this.m_data = {
            scores: [],
            names: []
        };

        this.load();
    }

    load()
    {
        // ef gögnin eru til staðar í localStorage
        if(localStorage.getItem(LSKEY) !== null)
        {
            // þá sækjum við þau
            let dataJSON = localStorage.getItem(LSKEY);

            // og færum þau í m_data objectið
            this.m_data = JSON.parse(dataJSON);
        }
        else // ef gögnin eru ekki til staðar í localStorage
        {
            // þá þarf að stofna þau
            this.reset();
        }
    }

    save()
    {
        // búum til JSON úr m_data
        let dataJSON = JSON.stringify(this.m_data);

        // og skrifum það í localStorage
        localStorage.setItem(LSKEY,dataJSON);
    }

    reset()
    {
        // sækja default
        this.m_data.scores = [100,4,3,2,1];
        this.m_data.names = ["AAF","AAF","AAF","AAF","AAF"];

        // og vista
        this.save();
    }

    is_high(score)
    {
        // það nægir að athuga neðsta skorið á listanum
        if(this.m_data.scores[NUM_HIGHSCORES-1] < score)
        {
            return true;
        }

        // annars kemst score ekki á listann
        return false;
    }

    insert(name,score)
    {
        // setjum gildi í index sem getur aldrei orðið til í lykkjunni
        let index = -1;

        // förum neðan frá í gegnum stigalistann
        for(let i = NUM_HIGHSCORES-1; i >= 0; i--)
        {
            // ef nýja skorið er hærra
            if(this.m_data.scores[i] < score)
            {
                // þá er þetta rétti staðurinn til að setja það
                index = i;
            }
            // ef það er lægra eða það sama
            else if(this.m_data.scores[i] >= score)
            {
                // þá hættum við að leita
                break;
            }
        }

        // ef við fundum stað til að setja nýja skorið
        if(index >= 0)
        {
            // þá bætum við því á réttan stað
            this.m_data.scores.splice(index,0,score);
            this.m_data.names.splice(index,0,name);

            // og fjarlægjum þann sem datt út
            this.m_data.scores.splice(NUM_HIGHSCORES,1);
            this.m_data.names.splice(NUM_HIGHSCORES,1);

            // og vistum
            this.save();
        }
    }
}

/******************************************************************************/

// Polygon
// grunnclass fyrir form
//
// meðlimabreytur:
//   m_scale -> skali á forminu, hægt að nota til að stækka eða minnka formið án
//              þess að þurfa að fikta í hnitunum
//   m_posX -> pixel staðsetning á X núllpunkti formsins
//   m_posY -> pixel staðsetning á Y núllpunkti formsins
//   m_thrust -> hröðun formins
//   m_velX -> hraði formsins á X-ás
//   m_velY -> hraði formsins á Y-ás
//   m_maxVel -> hæsti mögulegi hraði formsins á hvorum ás fyrir sig
//   m_angle -> horn í gráðum sem er notað til að teikna formið
//   m_movementAngle -> horn í gráðum sem er notað til að hreyfa formið
//   m_movementSpeed -> default hröðun formsins
//   m_rotationSpeed -> snúningshraði, hversu hratt m_angle breytist
//   m_points -> fylki af punktum sem er notað til að teikna/mynda formið
//   m_pointsCollision -> fylki af punktum sem er notað fyrir árekstraprufur
//                        oftast sama og m_points en stundum slice() af því
//   m_destroyed -> er formið ónýtt eftir árekstur?
//   m_pointValue -> stigafjöldi sem leikmaður fær við að eyða þessu formi
//   m_collided -> merkt þegar formið hefur þegar lent í árekstri, svo að
//                 áreksturinn sé ekki merktur tvisvar
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

        this.m_maxVel = 0;

        this.m_angle = 0;
        this.m_movementAngle = 0;

        this.m_movementSpeed = 0;
        this.m_rotationSpeed = 0;

        this.m_destroyed = false;
        this.m_pointValue = 0;

        this.m_collided = false;

        this.m_points = [];
        this.m_pointsCollision = [];
    }

    // umreiknar m_points hnit yfir í pixel hnit
    screen_coordinates(points)
    {
        // afrit tekið vegna þess að við munum breyta gildunum
        let tmpPoints = [...points];

        for(let i = 0; i < tmpPoints.length; i++)
        {
            // snúa hnitunum um m_angle
            tmpPoints[i] = rotate_coordinates(tmpPoints[i],this.m_angle);

            // "ytri" skölun á forminu (grid)
            tmpPoints[i] = [
                tmpPoints[i][0]*GRID,
                tmpPoints[i][1]*GRID
            ];

            // "innri" skölun á forminu (m_scale)
            tmpPoints[i] = [
                tmpPoints[i][0] * this.m_scale,
                tmpPoints[i][1] * this.m_scale
            ];

            // translation yfir á réttan stað á skjánum (pixel)
            tmpPoints[i] = [
                tmpPoints[i][0]+this.m_posX,
                tmpPoints[i][1]+this.m_posY
            ];
        }

        return tmpPoints;
    }

    // tekur við fylki af hnitum og teiknar línur á milli þeirra
    // endar á því að tengja seinasta punkt við upphafspunkt
    // hver undirclass keyrir þetta fall og gefur því fylki til að teikna
    draw(pointsArray)
    {
        // afrit tekið vegna þess að við munum breyta hnitunum
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

    // snýr forminu, keyrt í aðallykkju ef við á
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

    //hreyfir formið út frá m_thrust
    move()
    {
        // geyma gamla stefnuhorn
        let tmpAngle = this.m_movementAngle;
        let didChange = false;

        // þessi if block snýst um að hægja á hreyfingunni. Eins og er þá gerist
        // það bara hjá player. Við viljum bara eiga við hreyfinguna ef það er
        // einhver hreyfing að eiga sér stað og ef það er ekki verið að gefa inn
        if((this instanceof Player) && (this.m_velX != 0 || this.m_velY != 0) && (this.m_thrust == 0))
        {
            // sækja stefnuhorn á hraðanum
            let velAngle = this.get_velocity_angle();

            // snúa hreyfingarhorninu í 180 gráður frá stefnu hraðavigursins
            this.m_movementAngle = velAngle + 180;

            // passa að hornið sé á fyrsta hring
            if(this.m_movementAngle >= 360)
            {
                this.m_movementAngle -= 360;
            }

            // setja inn hröðun
            this.m_thrust = PLAYER_DRAG;

            // halda utanum það að hröðuninni og stefnuhorninu var breytt
            didChange = true;
        }

        // reikna hraðabreytinguna á ásunum
        let a = this.m_thrust * Math.cos(deg_to_rad(this.m_movementAngle));
        let b = this.m_thrust * Math.sin(deg_to_rad(this.m_movementAngle));

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
            this.m_posY += canvas.height;
        }
            
        if(this.m_posY > canvas.height)
        {
            this.m_posY -= canvas.height;
        }
            
        if(this.m_posX < 0)
        {
            this.m_posX += canvas.width;
        }
            
        if(this.m_posX > canvas.width)
        {
            this.m_posX -= canvas.width;
        }

        // lagfæring á hröðun og stefnuhorni ef því var breytt fremst í fallinu
        if(this instanceof Player && didChange == true)
        {
            this.m_thrust = 0;
            this.m_movementAngle = tmpAngle;
        }
    }

    // reiknar út og skilar stefnuhorni núverandi hraðavigurs
    // útkoman passar við m_angle (sem er snúinn um 90 gráður)
    get_velocity_angle()
    {
        // finna núverandi stefnu á hraðavigri í gráðum
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

    // sér um árekstraprófanir fyrir allar gerðir af Polygon klösum
    check_collision(objectToCheck)
    {
        // engir árekstrar fyrir hluti sem eru merktir ónýtir
        if(this.m_destroyed == true || objectToCheck.m_destroyed == true)
        {
            return false;
        }

        // engir árekstrar fyrir ósýnilegan og látinn leikmann
        if(this instanceof Player || objectToCheck instanceof Player)
        {
            if(gameObjects[playerIndex].is_alive() == false)
            {
                return false;
            }
        }

        // engir árekstrar fyrir líkamsleifar leikmanns
        if(this instanceof DeadPlayerSegment || objectToCheck instanceof DeadPlayerSegment)
        {
            return false;
        }

        // engir árekstrar fyrir hráan LineSegment heldur
        if(this instanceof LineSegment || objectToCheck instanceof LineSegment)
        {
            return false;
        }

        // engir asteroid->asteroid árekstrar
        if(this instanceof Asteroid && objectToCheck instanceof Asteroid)
        {
            return false;
        }

        // sleppum því að skoða árekstra tvisvar
        if(this.m_collided == true || objectToCheck.m_collided == true)
        {
            return false;
        }

        // það má ekki rekast á sjálfan sig
        if(this === objectToCheck)
        {
            return false;
        }

        let collided = false;

        // Bullet klasar eru ekki polygon form eins og hinir
        // þess vegna þarf að höndla 3 gerðir af árekstrum:
        // hringur-polygon, hringur-hringur og polygon-polygon
        if(this instanceof Bullet)
        {
            // this = hringur
            if(objectToCheck instanceof Bullet)
            {
                //objectToCheck = hringur
                collided = collision_circle_to_circle(this.m_posX,this.m_posX,BULLET_RADIUS,objectToCheck.m_posX,objectToCheck.m_posY,BULLET_RADIUS);
            }
            else
            {
                //objectToCheck = polygon form
                collided = collision_polygon_to_polygon(this.screen_coordinates(this.m_pointsCollision),objectToCheck.screen_coordinates(objectToCheck.m_pointsCollision),true);
            }
        }
        else
        {
            // this = polygon form
            if(objectToCheck instanceof Bullet)
            {
                //objectToCheck = hringur
                collided = collision_polygon_to_circle(this.screen_coordinates(this.m_pointsCollision),objectToCheck.m_posX,objectToCheck.m_posY,BULLET_RADIUS,true);
            }
            else
            {
                //objectToCheck = polygon form
                collided = collision_polygon_to_polygon(this.screen_coordinates(this.m_pointsCollision),objectToCheck.screen_coordinates(objectToCheck.m_pointsCollision),true);
            }
        }

        return collided;
    }
}

/******************************************************************************/

// Asteroid
// class fyrir asteroidin
//
// erfir allt sem Polygon hefur
//
class Asteroid extends Polygon
{
    constructor(X, Y, size)
    {
        super();

        this.m_posX = X;
        this.m_posY = Y;

        // passa að það verði einhver hreyfing
        do
        {
            this.m_velX = Math.floor(Math.random()*2);
            this.m_velY = Math.floor(Math.random()*2);
        }
        while(this.m_velX == 0 && this.m_velY == 0);

        this.m_rotationSpeed = 1;

        // random hvort þeir snúast til vinstri eða hægri
        if(Math.floor(Math.random() * 50) > 25)
        {
            this.m_rotationSpeed *= -1;
        }

        // handahófshorn milli 0 og 359
        this.m_angle = Math.floor(Math.random()*359);

        let tmpSize = 0;

        switch(size)
        {
            case SMALL_ASTEROID:
                tmpSize = 2;
                this.m_scale = 0.7;
                this.m_pointValue = SCORE_SMALL_ASTEROID;
                break;
            case MEDIUM_ASTEROID:
                tmpSize = 5;
                this.m_scale = 1.33;
                this.m_pointValue = SCORE_MEDIUM_ASTEROID;
                break;
            case LARGE_ASTEROID:
                tmpSize = 8;
                this.m_scale = 2.5;
                this.m_pointValue = SCORE_LARGE_ASTEROID;
                break;
        }

        if(DO_CLASSIC_SHAPES == true)
        {
            let tmpShape = random_number_range(0,3);
            this.m_points = [...classicAsteroidShapes[tmpShape]];
        }
        else
        {
            this.m_scale = 1;
            this.m_minrad = Math.round(tmpSize/3);
            this.m_points = [...random_shape(10,this.m_minrad,tmpSize)];
        }

        this.m_pointsCollision = [...this.m_points];
        numAsteroids++;
    }

    draw()
    {
        super.draw(this.m_points);
    }

    // bregst við árekstrum
    collided_with(collidedObject)
    {
        this.m_collided = true;
        this.m_destroyed = true;

        // var verið að rekast á kúlu?
        if(collidedObject instanceof Bullet)
        {
            // og skaut leikmaðurinn henni?
            if(collidedObject.m_playerBullet == true)
            {
                // vel gert, gefum honum stig
                gameObjects[playerIndex].give_score(this.m_pointValue);
            }
        }

        let offset = ASTEROID_SPAWN_OFFSET;

        // stigafjöldi notaður til að meta stærðina
        // vegna þess að það var einfalt og þægilegt
        switch(this.m_pointValue)
        {
            case SCORE_SMALL_ASTEROID:// lítið asteroid
                play_audio(audioExplosionSmall)
                break;
            case SCORE_MEDIUM_ASTEROID:// miðlungs asteroid
                play_audio(audioExplosionMedium)

                // búum svo til 2 lítil
                create_asteroid(this.m_posX-offset, this.m_posY-offset, SMALL_ASTEROID);
                create_asteroid(this.m_posX+offset, this.m_posY+offset, SMALL_ASTEROID);
                break;
            case SCORE_LARGE_ASTEROID:// stórt asteroid
                play_audio(audioExplosionLarge)

                // búum til 2 miðlungs asteroid
                create_asteroid(this.m_posX-offset, this.m_posY-offset, MEDIUM_ASTEROID);
                create_asteroid(this.m_posX+offset, this.m_posY+offset, MEDIUM_ASTEROID);
                break;
        }
    }
}

/******************************************************************************/

// Bullet
// class fyrir kúlur sem er skotið
//
// erfir allt sem Polygon hefur
//
// meðlimabreytur sem bætast við:
//   m_birth -> fæðingartími kúlunnar, notað til að reikna hvort hún sé útrunnin
//   m_playerBullet -> ákvarðar hvort kúlunni var skotið af leikmanni eða ekki
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

        this.m_birth = timestamp_now();
        this.m_playerBullet = playerBullet;

        numBullets++;
    }

    // hreyfir kúluna eða merkir hana sem útrunna
    move()
    {
        let age = timestamp_now() - this.m_birth;
        if(age <= BULLET_MAX_AGE || BULLET_MAX_AGE == -1)
        {
            super.move();
        }
        else
        {
            this.m_destroyed = true;
        }
    }

    // sér teiknifall fyrir þennan klasa
    // þessi klassi notar ekki m_points heldur teiknar hring á m_posX,m_posY
    draw()
    {
        context.save();
        context.fillStyle = COLOR_FOREGROUND;
        context.beginPath();
        context.arc(this.m_posX, this.m_posY, BULLET_RADIUS, 0, 2*Math.PI);
        context.fill();
        context.restore();
    }

    // bregst við árekstrum
    collided_with(collidedObject)
    {
        this.collided = true;
        this.m_destroyed = true;
    }
}

/******************************************************************************/

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

        if(DO_CLASSIC_SHAPES)
        {
            this.m_points = [...classicShipShape];
        }
        else
        {
            this.m_points = [...newShipShape];
        }

        if(DO_CLASSIC_SHAPES)
        {
            this.m_pointsCollision = this.m_points.slice(0,5);
        }
        else
        {
            this.m_pointsCollision = this.m_points.slice(0,4);
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
        if(DO_CLASSIC_SHAPES)
        {
            i = 5;
        }

        // teikna fyrst skipið
        super.draw(this.m_points.slice(0,i));

        // og svo eldinn ef það á við
        if(this.m_drawFlame)
        {
            super.draw(this.m_points.slice(i));
        }
    }
}

/******************************************************************************/

// Player
// classi til að halda utan um leikmanninn
//
// erfir allt frá Ship sem erfir allt frá Polygon
//
// meðlimabreytur sem bætast við:
//   m_playerLives -> aukalíf sem leikmaður á eftir
//   m_playerScore -> stig sem leikmaður er kominn með
//   m_playerAlive -> boolean fyrir það hvort leikmaður sé á lífi
//
// meðlimaföll sem bætast við:
//      thrust() -> virkjar hröðun
//    is_alive() -> true/false eftir því hvort leikmaður er á lífi
//         die() -> myrðir leikmann í köldu blóði
//  give_score() -> gefur leikmanni stig
//   give_life() -> gefur leikmanni aukalíf
//   
class Player extends Ship
{
    constructor(X,Y)
    {
        super(X,Y);

        this.m_movementSpeed = PLAYER_ACCELERATION;
        this.m_rotationSpeed = PLAYER_ROTATION_SPEED;
        this.m_maxVel = PLAYER_MAX_VELOCITY;
        this.m_playerScore = 0;
        this.m_timeOfLastDeath = 0;
        this.m_justLostGame = false;
        this.m_nextExtraLifeScore = SCORE_EXTRA_LIFE;

        // þessi gildi eru stillt svona svo það sé enginn leikmaður virkur þegar
        // leikurinn keyrir í fyrsta sinn. Þau eru svo uppfærð í rétt gildi við
        // það að valið sé "new game" í valmynd
        this.m_playerAlive = false;
        this.m_playerLives = -1;
    }

    reset()
    {
        this.m_playerScore = 0;
        this.m_playerLives = PLAYER_START_LIVES;
        this.resurrect();
    }

    //stillir hröðun formsins
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

    is_alive()
    {
        return this.m_playerAlive;
    }

    is_gameover()
    {
        if(this.m_playerLives < 0 && this.is_alive() == false)
        {
            return true;
        }
        return false;
    }

    die()
    {
        // maður getur varla dáið ef maður er þegar dáinn
        if(this.m_playerAlive == false)
        {
            return;
        }

        play_audio(audioExplosionSmall);

        this.m_timeOfLastDeath = timestamp_now();
        this.m_playerAlive = false;
        this.m_playerLives--;

        let numLines = 4;
        if(DO_CLASSIC_SHAPES == true)
        {
            numLines = 5;
        }

        let next = 0;
        for(let i = 0; i < numLines;i++)
        {
            next = i+1;
            if(next == numLines)
            {
                next = 0;
            }

            let linePoints = [];
            linePoints.push(this.m_points[i]);
            linePoints.push(this.m_points[next]);

            gameObjects.push(new DeadPlayerSegment(this.m_posX,this.m_posY,linePoints,this.m_velX,this.m_velY,this.m_angle));
        }
    }

    resurrect()
    {
        if(this.m_playerLives > -1)
        {
            this.m_playerAlive = true;
            this.m_posX = PLAYER_START_X;
            this.m_posY = PLAYER_START_Y;
            this.m_velX = 0;
            this.m_velY = 0;
            this.m_angle = 0;
            this.m_movementAngle = 0;
            this.m_justLostGame = false;
        }
    }

    // athugar hvort stigin séu komin yfir ákveðinn áfanga
    // t.d. 10000, 20000, 30000 o.s.frv.
    check_score_threshold()
    {
        if(this.m_playerScore >= this.m_nextExtraLifeScore)
        {
            this.m_nextExtraLifeScore += SCORE_EXTRA_LIFE;
            this.give_life(1);
        }
    }

    give_score(num)
    {
        if(this.is_gameover() == false)
        {
            this.m_playerScore += num;
            this.check_score_threshold();
        }
    }

    give_life(num)
    {
        this.m_playerLives += num;
    }

    shoot()
    {
        /*
        // passa að búa ekki til fleiri kúlur en mega vera
        if(numBullets >= MAX_BULLETS)
        {
            return;
        }
        */

        // maður getur varla skotið ef maður er ekki á lífi
        if(!this.is_alive())
        {
            return;
        }

        // gera hávaða
        play_audio(audioShoot);

        // hraðavigur fyrir kúluna
        let tmpVelY = -BULLET_VELOCITY * Math.cos(deg_to_rad(this.m_movementAngle));
        let tmpVelX =  BULLET_VELOCITY * Math.sin(deg_to_rad(this.m_movementAngle));

        // staðsetningarvigur fyrir kúluna
        let a2 = (2*GRID) * Math.cos(deg_to_rad(this.m_movementAngle));
        let b2 = (2*GRID) * Math.sin(deg_to_rad(this.m_movementAngle));

        gameObjects.push(new Bullet((this.m_posX+b2), (this.m_posY-a2), tmpVelX, tmpVelY, true));
    }

    // hreyfir, vekur leikmann upp frá dauðum eða merkir við game over
    move()
    {
        if(this.is_alive())
        {
            super.move();
        }
        else
        {
            if(this.m_playerLives == -1)
            {
                this.m_justLostGame = true;

                this.m_playerLives--;// ljótt hakk, TODO: laga strúktúrinn betur
            }
            else
            {
                if(timestamp_now()-this.m_timeOfLastDeath >= PLAYER_DEAD_TIME)
                {
                    this.resurrect();
                }
            }
        }
    }

    draw()
    {
        if(this.is_alive())
        {
            super.draw();
        }
    }

    // bregst við árekstrum
    collided_with(collidedObject)
    {
        this.collided = true;

        audioThrust.pause();
        audioThrust.currentTime = 0;

        this.die();
    }
}

/******************************************************************************/

// LineSegment
// classi til að halda utan um stakar línur
//
// erfir allt sem Polygon hefur
class LineSegment extends Polygon
{
    constructor(X,Y,points,velX,velY,rotationSpeed,angle)
    {
        super();

        this.m_posX = X;
        this.m_posY = Y;

        this.m_velX = velX;
        this.m_velY = velY;

        this.m_angle = angle;

        this.m_rotationSpeed = rotationSpeed;

        this.m_points = [...points];
    }

    draw()
    {
        super.draw(this.m_points);
    }
}

/******************************************************************************/

// DeadPlayerSegment
// classi til að halda utan um stakar einingar af látnum leikmanni
//
// erfir allt frá LineSegment sem erfir allt frá Polygon
//
// notað til að "brjóta" látinn leikmann í línubúta við árekstra
//
// meðlimabreytur sem bætast við:
//   m_birth -> fæðingartími viðkomandi búts
class DeadPlayerSegment extends LineSegment
{
    constructor(X,Y,points,velX,velY,angle)
    {
        // reikna random átt fyrir rotation hraða
        let tmpRotation = 1;
        let tmpRandom = Math.floor(Math.random() * 99);
        if(tmpRandom <= 49)
        {
            tmpRotation *= -1;
        }

        // fuzza velX smá
        if(velX != 0)
        {
            velX *= Math.random();
        }
        else// passa að búturinn hafi einhverja hreyfingu á X ás
        {
            velX = Math.random();
        }

        // fuzza velY smá
        if(velY != 0)
        {
            velY *= Math.random();
        }
        else// passa að búturinn hafi einhverja hreyfingu á Y ás
        {
            velY = Math.random();
        }

        super(X,Y,points,velX,velY,tmpRotation,angle);

        this.m_birth = timestamp_now();
    }

    // teikna eða fjarlægja bútinn
    draw()
    {
        if(timestamp_now()-this.m_birth < PLAYER_DEAD_TIME)
        {
            super.draw();
        }
        else
        {
            this.m_destroyed = true;
        }
    }
}

/******************************************************************************/

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
        this.m_pointsCollision = [...this.m_points];

        numEnemies++;
    }

    draw()
    {
        // teiknað í tvennu lagi til að fá línurnar þvert á skipið
        super.draw(this.m_points.slice(0,8));
        super.draw(this.m_points.slice(8));
    }

    collided_with(collidedObject)
    {
        this.m_collided = true;
        this.m_destroyed = true;

        if(collidedObject instanceof Bullet)
        {
            if(collidedObject.m_playerBullet == true)
            {
                gameObjects[playerIndex].give_score(this.m_pointValue);
            }
        }

        switch(this.m_pointValue)
        {
            case SCORE_SMALL_ENEMY:
                play_audio(audioExplosionSmall);
                break;
            case SCORE_BIG_ENEMY:
                play_audio(audioExplosionLarge);
                break;
        }
    }

    shoot(angle)
    {
        if(this.m_destroyed == true || this.m_collided == true)
        {
            return;
        }

        // gera hávaða
        play_audio(audioShoot);

        // hraðavigur fyrir kúluna
        let tmpVelY = -BULLET_VELOCITY * Math.cos(deg_to_rad(angle));
        let tmpVelX =  BULLET_VELOCITY * Math.sin(deg_to_rad(angle));

        // staðsetningarvigur fyrir kúluna
        let a2 = (5*GRID) * Math.cos(deg_to_rad(angle));
        let b2 = (5*GRID) * Math.sin(deg_to_rad(angle));

        gameObjects.push(new Bullet((this.m_posX+b2), (this.m_posY-a2), tmpVelX, tmpVelY, false));
    }
}

/******************************************************************************/

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
        this.m_pointValue = SCORE_BIG_ENEMY;
    }

    // skýtur random skotum
    shoot()
    {
        let angle = Math.floor(Math.random() * 359);
        super.shoot(angle);
    }
}

/******************************************************************************/

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
        this.m_pointValue = SCORE_SMALL_ENEMY;
    }

    // skýtur í áttina að leikmanni
    shoot()
    {
        // skrá punktana
        let X1 = gameObjects[playerIndex].m_posX;
        let Y1 = gameObjects[playerIndex].m_posY;
        let X2 = this.m_posX;
        let Y2 = this.m_posY;

        // reikna hornið á milli þeirra
        let thetaRad = Math.atan2((Y2-Y1),(X2-X1));

        // breyta því í gráður
        let theta = thetaRad * (180/Math.PI);

        // leiðrétta það vegna þess hvernig hnitakerfið í leiknum snýr
        theta -= 90;

        if(theta < 0)
        {
            theta += 360;
        }

        super.shoot(theta);
    }
}

/*******************************************************************************
* fylki fyrir form sem ganga beint inn i m_points í Polygon klösum (nema font) *
*******************************************************************************/

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

/******************************************************************************/

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

/******************************************************************************/

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

/******************************************************************************/

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

/******************************************************************************/

// fonturinn fyrir leikinn
// stafirnir eru skilgreindir frá neðra vinstra horni í 2x3 hnitakerfi
// stafirnir samanstanda af mismörgum línum sem eru skilgreindar með 2 punktum
const font = {
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

/******************************************************************************/

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
// p1x, p1y -> X og Y hnit á fyrri punktinum (pixel hnit)
// p2x, p2y -> X og Y hnit á seinni punktinum (pixel hnit)
// sensitivity -> næmnin á árekstrinum
//
// Ef næmnin er notuð, þá smíðar fallið hringi á punktunum með næmnina sem
// radíus og athugar svo hvort þeir snertast.
// Það þýðir að næmnin hækkar með hækkandi gildi
function collision_point_to_point(p1x, p1y, p2x, p2y, sensitivity = 0)
{
    if(sensitivity > 0)
    {
        // fyrst það var gefin upp næmni, þá notum við 2 hringi í staðinn
        return collision_circle_to_circle(p1x,p1y,sensitivity,p2x,p2y,sensitivity);
    }
    else
    {
        // ef punktarnir eru á sama stað, þá er árekstur
        if(p1x == p2x && p1y == p2y)
        {
            return true;
        }
    }

    return false;
}

// collision_point_to_circle()
// athugar árekstur á milli punkts og hrings
//
// p1x, p1y -> X og Y hnit á punktinum (pixel hnit)
// cx, cy -> X og Y hnit á miðjupunkti hringsins (pixel hnit)
// cr -> radíus hringsins (pixel stærð)
// sensitivity -> næmnin á árekstrinum
//
// Ef næmnin er notuð, þá smíðar fallið hring á punktinum með næmnina sem radíus
// og athugar svo hvort sá hringur rekist á hringinn sem er verið að bera saman
// við
// Það þýðir að næmnin hækkar með hækkandi gildi
function collision_point_to_circle(px, py, cx, cy, cr, sensitivity = 0)
{
    if(sensitivity > 0)
    {
        return collision_circle_to_circle(px,py,sensitivity,cx,cy,cr);
    }
    else
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
    }

    return false;
}

// collision_circle_to_circle()
// athugar árekstur á milli tveggja hringja
//
// c1x, c1y -> X og Y hnit á miðjupunkti fyrri hringsins (pixel hnit)
// c1r -> radíus fyrri hringsins (pixel stærð)
// c1x, c1y -> X og Y hnit á miðjupunkti seinni hringsins (pixel hnit)
// c1r -> radíus seinni hringsins (pixel stærð)
// sensitivity -> næmnin á árekstrinum
//
// Ef næmnin er notuð, þá bætir fallið næmninni á radíusana á hringjunum
// Það þýðir að næmnin hækkar með hækkandi gildi og lækkar með lækkandi gildi
function collision_circle_to_circle(c1x,c1y,c1r,c2x,c2y,c2r,sensitivity = 0)
{
    // pýþagóras til að finna lengd línunnar á milli miðjupunkta hringjanna
    let A = c1x - c2x;
    let B = c1y - c2y;
    let C = Math.sqrt((A*A)+(B*B));

    // ef samanlagður radíus hringjanna er minni en eða
    // sami og fjarlægðin á milli miðjupunktanna, þá er árekstur
    if(C <= (c1r+c2r+sensitivity))
    {
        return true;
    }

    return false;
}

// collision_point_to_rectangle()
// athugar árekstur á milli punkts og ferhyrnings
//
// px, py -> X og Y hnit á punktinum (pixel hnit)
// rx, ry -> X og Y hnit á efra vinstra horni ferhyrningsins (pixel hnit)
// rw, rh -> breidd og hæð ferhyrningsins (pixel stærð)
// sensitivity -> næmnin á árekstrinum
//
// Ef næmnin er notuð, þá smíðar fallið hring á punktinum með næmnina sem radíus
// og athugar svo hvort sá hringur rekist á ferhyrninginn sem er verið að bera
// saman við
// Það þýðir að næmnin hækkar með hækkandi gildi
function collision_point_to_rectangle(px, py, rx, ry, rw, rh, sensitivity = 0)
{
    if(sensitivity > 0)
    {
        return collision_circle_to_rectangle(px,py,sensitivity,rx,ry,rw,rh);
    }
    else
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
    }

    return false;
}

// collision_rectangle_to_rectangle()
// athugar árekstra á milli tveggja ferhyrninga
//
// r1x, r1y -> X og Y hnit á efra vinstra horni fyrri ferhyrningsins (pixel hnit)
// r1w, r1h -> breidd og hæð fyrri ferhyrningsins (pixel stærð)
// r2x, r2y -> X og Y hnit á efra vinstra horni seinni ferhyrningsins (pixel hnit)
// r2w, r2h -> breidd og hæð seinni ferhyrningsins (pixel stærð)
// sensitivity -> næmnin á árekstrinum
//
// Ef næmnin er notuð þá bætir fallið helmingnum af næmninni á allar hliðar á
// hvorum ferhyrningi
// Það þýðir að næmnin hækkar og lækkar með hækkandi og lækkandi gildi
function collision_rectangle_to_rectangle(r1x,r1y,r1w,r1h,r2x,r2y,r2w,r2h,sensitivity = 0)
{
    // hliðra r1 fyrst um hálfa næmni
    r1x -= (sensitivity/2);
    r1y -= (sensitivity/2);
    // og stækka/minnka hann svo um 1 næmni
    r1h += sensitivity;
    r1w += sensitivity;

    // hliðra r2 fyrst um hálfa næmni
    r2x -= (sensitivity/2);
    r2y -= (sensitivity/2);
    // og stækka/minnka hann svo um 1 næmni
    r2h += sensitivity;
    r2w += sensitivity;

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
// cx, cy -> X og Y hnit á miðjupunkti hringsins (pixel hnit)
// cr -> radíus hringsins (pixel stærð)
// rx, ry -> X og Y hnit á efra vinstra horni ferhyrningsins (pixel hnit)
// rw, rh -> breidd og hæð ferhyrningsins (pixel stærð)
// sensitivity -> næmnin á árekstrinum
//
// Ef næmnin er notuð, þá breytir hún radíus hringsins og hefur þannig áhrif á
// samanburðinn
// Hærra gildi leiðir til hækkandi næmni og öfugt
function collision_circle_to_rectangle(cx,cy,cr,rx,ry,rw,rh,sensitivity = 0)
{
    // læsileikabreytur fyrir mörk ferhyrningsins
    let leftEdge = rx;
    let rightEdge = rx+rw;
    let topEdge = ry;
    let bottomEdge = ry+rh;

    // byrja á að skoða staðsetningu hringsins
    let tmpX = cx;
    let tmpY = cy;

    // ef hringurinn er hægra megin við ferhyrninginn
    // þá berum við saman við hægri brúnina á X ás
    if(tmpX > rightEdge)
    {
        tmpX = rightEdge;
    }
    // en ef hringurinn er vinstra megin við ferhyrninginn
    // þá berum við saman við vinstri brúnina á X ás
    else if(tmpX < leftEdge)
    {
        tmpX = leftEdge;
    }

    // ef hringurinn er neðan við ferhyrninginn
    // þá berum við saman við neðri brúnina á Y ás
    if(tmpY > bottomEdge)
    {
        tmpY = bottomEdge;
    }
    // en ef hringurinn er ofan við ferhyrninginn
    // þá berum við saman við efri brúnina á Y ás
    else if(tmpY < topEdge)
    {
        tmpY = topEdge;
    }

    // pýþagóras til að reikna fjarlægðina á milli hringsins
    // og brúnanna sem við völdum hér að ofan
    let A = cx-tmpX;
    let B = cy-tmpY;
    let C = Math.sqrt((A*A)+(B*B));

    // ef sú fjarlægð er minni en radíus hringsins, þá er árekstur
    if(C <= (cr+sensitivity))
    {
        return true;
    }

    return false;
}

// collision_line_to_point()
// athugar árekstur á milli línu og punkts
//
// l1x, l1y -> X og Y hnit á upphafspunkti línunnar (pixel hnit)
// l2x, l2y -> X og Y hnit á endapunkti línunnar (pixel hnit)
// px, py -> X og Y hnit á punktinum (pixel hnit)
// sensitivity -> næmni árekstursins, næmnin hækkar með lækkandi gildi
//
// Ef næmnin er 0 þá þarf punkturinn að lenda nákvæmlega á línunni sem
// gæti leitt til þess að maður missi af árekstrinum. 0.1 virðist vera
// ágætis meðalvegur á milli næmni og nákvæmni
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

    // ef lengd á p1C + p2C er sú sama og lengd línunnar, þá er árekstur
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
// l1x, l1y -> X og Y hnit á upphafspunkti línunnar (pixel hnit)
// l2x, l2y -> X og Y hnit á endapunkti línunnar (pixel hnit)
// cx, cy -> X og Y hnit á miðjupunkti hringsins (pixel hnit)
// cr -> radíus hringsins (pixel stærð)
// sensitivity -> næmni árekstursins
//
// Ef næmnin er notuð, þá breytir hún radíus hringsins og hefur þannig áhrif á
// samanburðinn
// Hærra gildi leiðir til hækkandi næmni og öfugt
function collision_line_to_circle(l1x,l1y,l2x,l2y,cx,cy,cr,sensitivity = 0)
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

    // lengja einingarvigurinn um innfeldið og hliðra honum um upphafspunkt
    // línunnar til að fá út punkt á línunni sem er næstur hringnum
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
    if(tC <= (cr+sensitivity))
    {
        return true;
    }

    return false;
}

// collision_line_to_line()
// athugar árekstra á milli tveggja lína
//
// l1x, l1y -> X og Y hnit á upphafspunkti fyrri línunnar (pixel hnit)
// l2x, l2y -> X og Y hnit á endapunkti fyrri línunnar (pixel hnit)
// l3x, l3y -> X og Y hnit á upphafspunkti seinni línunnar (pixel hnit)
// l4x, l4y -> X og Y hnit á endapunkti seinni línunnar (pixel hnit)
function collision_line_to_line(l1x,l1y,l2x,l2y,l3x,l3y,l4x,l4y)
{
    // Sjá "Intersection Point of Two Lines (2 Dimensions)"
    // eftir Paul Bourke fyrir nákvæma útskýringu á því hvernig þessi
    // aðferð virkar.
    // Aðgengilegt hérna: https://paulbourke.net/geometry/pointlineplane/
    let denominator = ((l4y-l3y)*(l2x-l1x) - (l4x-l3x)*(l2y-l1y));

    let line1numerator = ((l4x-l3x)*(l1y-l3y) - (l4y-l3y)*(l1x-l3x));
    let line2numerator = ((l2x-l1x)*(l1y-l3y) - (l2y-l1y)*(l1x-l3x));

    let line1_u = line1numerator / denominator;
    let line2_u = line2numerator / denominator;

    // ef u fyrir línu 1 og línu 2 liggja báðir milli 0 og 1
    // þá skerast línurnar og það verður árekstur
    if(line1_u >= 0 && line1_u <= 1 && line2_u >= 0 && line2_u <= 1)
    {
        return true;
    }

    return false;
}

// collision_line_to_rectangle()
// athugar árekstra á milli línu og ferhyrnings
//
// l1x, l1y -> X og Y hnit á upphafspunkti línunnar (pixel hnit)
// l2x, l2y -> X og Y hnit á endapunkti línunnar (pixel hnit)
// rx, ry -> X og Y hnit á efra vinstra horni ferhyrningsins (pixel hnit)
// rw, rh -> breidd og hæð ferhyrningsins (pixel stærð)
// sensitivity -> næmni árekstursins
//
// Ef næmnin er notuð þá bætir fallið helmingnum af næmninni á allar hliðar á
// hvorum ferhyrningi
// Það þýðir að næmnin hækkar og lækkar með hækkandi og lækkandi gildi
function collision_line_to_rectangle(l1x,l1y,l2x,l2y,rx,ry,rw,rh,sensitivity = 0)
{
    // hliðra ferhyrningnum fyrst um hálfa næmni
    rx -= (sensitivity/2);
    ry -= (sensitivity/2);
    // og stækka/minnka hann svo um 1 næmni
    rh += sensitivity;
    rw += sensitivity;

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
    if( collisionLeft == true || collisionRight == true ||
        collisionTop == true || collisionBottom == true)
    {
        return true;
    }

    return false;
}

// collision_polygon_to_point()
// athugar árekstur á milli polygons og punkts
//
// vertices -> fylki með X,Y hnitum allra punktanna á polygoninum
//             ATH: ekki m_points, heldur eftir umbreytingarnar
// px, py -> X og Y hnit á punktinum (pixel hnit)
// sensitivity -> næmni árekstursins
// testInside -> ef næmni er notuð, viljum við athuga hvort næmnishringurinni sé
//               í heild sinni inni í polygoninum?
//
// Ef næmnin er notuð, þá smíðar fallið hring á punktinum með næmnina sem radíus
// og athugar svo hvort sá hringur rekist á polygoninn sem er verið að bera
// saman við
// Það þýðir að næmnin hækkar með hækkandi gildi
//
// Þetta fall telur hversu oft polygoninn "snýst" í kringum punktinn
// ef útkoman er 0, þá liggur punkturinn utan við polygoninn
// ef útkoman er eitthvað annað en 0, þá liggur punkturinn inni í polygoninum
function collision_polygon_to_point(vertices,px,py,sensitivity = 0,testInside = false)
{
    // breytur til að auka læsileika
    const X = 0;
    const Y = 1;

    let windings = 0;
    let next = 0;

    if(sensitivity > 0)
    {
        if(collision_polygon_to_circle(vertices,px,py,sensitivity,testInside) == true)
        {
            // merkja að það hafi orðið árekstur
            windings = 1;
        }
    }
    else
    {
        // fara yfir alla punktana á polygoninum
        for(let current = 0;current < vertices.length;current++)
        {
            // sækja index á næsta punkti
            next = current + 1;

            // ef við erum komin út fyrir fylkið
            // þá notum við fyrsta sem endapunkt
            if(next == vertices.length)
            {
                next = 0;
            }

            // sækja punktana sem er verið að vinna með
            let currentVertex = vertices[current];
            let nextVertex = vertices[next];

            // ef við byrjum neðan við
            if(currentVertex[Y] <= py)
            {
                // og förum upp
                if(nextVertex[Y] > py)
                {
                    // og ef px,py er vinstra megin við línuna sem punktarnir marka
                    if(collision_util_heron(currentVertex[X],currentVertex[Y],nextVertex[X],nextVertex[Y],px,py) > 0)
                    {
                        // þá bætist við snúningur
                        windings++;
                    }
                }
            }
            else// ef við byrjum ofan við
            {
                // og förum niður
                if(nextVertex[Y] <= py)
                {
                    // og ef px,py er hægra megin við línuna sem punktarnir marka
                    if(collision_util_heron(currentVertex[X],currentVertex[Y],nextVertex[X],nextVertex[Y],px,py) < 0)
                    {
                        // þá dregst frá snúningur
                        windings--;
                    }
                }
            }
        }
    }

    // ef snúningarnir voru nákvæmlega 0 þá var ekki árekstur
    if(windings == 0)
    {
        return false;
    }
    else// ef eitthvað annað en 0 kom út, þá var árekstur
    {
        return true;
    }
}

// collision_polygon_to_circle()
// athugar árekstra á milli polygons og hrings
//
// vertices -> fylki með X,Y hnitum allra punktanna á polygoninum
//             ATH: ekki m_points, heldur eftir umbreytingar
// cx, cy -> X og Y hnit á miðjupunkti hringsins (pixel hnit)
// cr -> radíus hringsins (pixel stærð)
// testInside -> athuga hvort hringurinn í heild sinni sé inni í polygoninum?
//               (þyngra í vinnslu, default er að sleppa því)
//
// TODO - sensitivity
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

        // athuga hvort hringurinn snerti línuna sem
        // markast af currentVertex og nextVertex
        let collision = collision_line_to_circle(currentVertex[X], currentVertex[Y], nextVertex[X], nextVertex[Y], cx,cy,cr);

        // ef hann gerir það, þá er árekstur og við
        // þurfum ekki að skoða fleiri punkta
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
// vertices -> fylki með X,Y hnitum allra punktanna á polygoninum
//             ATH: ekki m_points, heldur eftir umbreytingar)
// rx, ry -> X og Y hnit á efra vinstra horni ferhyrningsins (pixel hnit)
// rw, rh -> breidd og hæð ferhyrningsins (pixel stærð)
// testInside -> athuga hvort ferhyrningurinn í heild sinni sé inni í polygoninum?
//               (þyngra í vinnslu, default er að sleppa því)
//
// TODO - hugsa um hvernig sé best að bæta við sensitivity í parametrana
function collision_polygon_to_rectangle(vertices,rx,ry,rw,rh,testInside = false)
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

        // athuga hvort ferhyrningurinn snerti línuna sem
        // markast af currentVertex og nextVertex
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
// vertices -> fylki með X,Y hnitum allra punktanna á polygoninum
//             ATH: ekki m_points, heldur eftir umbreytingar
// l1x, l1y -> X og Y hnit á upphafspunkti línunnar (pixel hnit)
// l2x, l2y -> X og Y hnit á endapunkti línunnar (pixel hnit)
//
// TODO - hugsa um hvernig sé best að bæta við sensitivity í parametrana
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

        // athuga hvort línan sker/snertir línuna sem
        // markast af currentVertex og nextVertex
        let collision = collision_line_to_line(l1x,l1y,l2x,l2y,l3x,l3y,l4x,l4y);

        // ef hún gerir það, þá er árekstur og við
        // þurfum ekki að skoða fleiri punkta
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
// vertices1 -> fylki með X,Y hnitum allra punktanna á polygoninum
//              ATH: ekki m_points, heldur eftir umbreytingar
// vertices2 -> fylki með X,Y hnitum allra punktanna á polygoninum
//              ATH: ekki m_points, heldur eftir umbreytingar
// testInside -> skal athuga hvort polygon2 í heild sinni sé inni í polygon1?
//               (þyngra í vinnslu, default er að sleppa því)
//
// TODO - hugsa um hvernig sé best að bæta við sensitivity í parametrana
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

        // athuga hvort polygon2 sé með árekstur við línuna
        // sem markast af currentVertex og nextVertex
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
// t1x, t1y -> X og Y hnit á fyrsta horninu á þríhyrningnum (pixel hnit)
// t2x, t2y -> X og Y hnit á öðrum horninu á þríhyrningnum (pixel hnit)
// t3x, t3y -> X og Y hnit á þriðja horninu á þríhyrningnum (pixel hnit)
// px, py -> X og Y hnit á punktinum (pixel hnit)
function collision_triangle_to_point(t1x,t1y,t2x,t2y,t3x,t3y,px,py)
{
    // notum Heron til að finna flatarmál þríhyrningsins
    let areaT = Math.abs(collision_util_heron(t1x,t1y,t2x,t2y,t3x,t3y));

    // myndum svo 3 nýja þríhyrninga með px,py punktinum og
    // hverri hlið um sig í upprunalega þríhyrningnum
    // og reiknum flatarmál þeirra með Heron
    let area1 = Math.abs(collision_util_heron(px,py,t1x,t1y,t2x,t2y));
    let area2 = Math.abs(collision_util_heron(px,py,t2x,t2y,t3x,t3y));
    let area3 = Math.abs(collision_util_heron(px,py,t3x,t3y,t1x,t1y));

    // ef samanlagt flatarmál þessara 3 þríhyrninga er
    // það sama og flatarmál upprunalega þríhyrningsins
    // þá er árekstur
    if(area1+area2+area3 == areaT)
    {
        return true;
    }

    return false;
}

// collision_util_heron()
// athugar hvar punktur liggur miðað við línu
// notar formúlu Herons til að reikna flatarmál þríhyrnings sem punktarnir mynda
//
// p1x, p1y -> X, Y hnit á punkti sem liggur á línunni
// p2x, p2y -> X, Y hnit á öðrum punkti sem liggur á línunni
// p3x, p3y -> X, Y hnit á punktinum sem er verið að skoða
//
// svargildi:
// neikvæð tala -> punkturinn er hægra megin við línuna
//            0 -> punkturinn er á línunni
//  jákvæð tala -> punkturinn er vinstra megin við línuna
function collision_util_heron(p1x,p1y,p2x,p2y,p3x,p3y)
{
    return ((p2x-p1x)*(p3y-p1y)-(p3x-p1x)*(p2y-p1y));
}
