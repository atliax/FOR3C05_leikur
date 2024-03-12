const canvas = document.getElementById('mainCanvas');
const context = canvas.getContext('2d');

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_S = 83;
const KEY_E = 69;

const NUM_STARS = 500;

const grid = 10;

const playerStartX = context.canvas.width/2;
const playerStartY = context.canvas.height/2;
const playerSpeed = 0.3;
const playerMaxSpeed = 5;
const playerRotationSpeed = 15;

let keys = {
    KEY_LEFT: false,
    KEY_RIGHT: false,
    KEY_UP: false,
    KEY_DOWN: false,
    KEY_SPACE: false,
    KEY_S: false,
    KEY_E: false
};

let asteroids = [];
let saucers = [];

let generatedBackground = false;
let storedBackground;

context.strokeStyle = "white";
context.fillStyle = "black";
context.lineWidth = 1;

document.addEventListener("keydown",keydown);
document.addEventListener("keyup",keyup);

window.requestAnimationFrame(update);

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

    window.requestAnimationFrame(update);
}

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
        //player.shoot();
    }

    if(keys[KEY_S] == true)
    {
        let asteroidStartX = Math.floor(Math.random()*(context.canvas.width-1));
        let asteroidStartY = Math.floor(Math.random()*(context.canvas.height-1));
        asteroids.push(new Asteroid(asteroidStartX,asteroidStartY));
    }

    if(keys[KEY_E] == true)
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
    }
}

function draw_background()
{
    if(!generatedBackground)
    {
        //hreinsa skjáinn með því að teikna kassa
        context.clearRect(0,0,context.canvas.width,context.canvas.height);
        context.beginPath();
        context.rect(0,0,context.canvas.width,context.canvas.height);
        context.fill();

        for(let i = 0; i < NUM_STARS;i++)
        {
            let sX = Math.floor(Math.random()*(context.canvas.width-1));
            let sY = Math.floor(Math.random()*(context.canvas.height-1));
            context.fillStyle = "white";
            context.fillRect(sX,sY,1,1);
        }
        context.fillStyle = "black";

        storedBackground = canvas.toDataURL();

        generatedBackground = true;
    }
    else
    {
        let tmpImg = new Image();
        tmpImg.src = storedBackground;
        context.drawImage(tmpImg,0,0);
    }
}

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

function randomShape(nodes,minR,maxR)
{
    let angleStep = (Math.PI * 2) / nodes;

    let tmpRet = [];
    let x, y;

    for(let i = 0;i < nodes;i++)
    {
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

function degToRad(a)
{
    return a * (Math.PI/180);
}

function rotate([X,Y],angle)
{
    let nX = X*Math.cos(degToRad(angle))-Y*Math.sin(degToRad(angle));
    let nY = X*Math.sin(degToRad(angle))+Y*Math.cos(degToRad(angle));
    return [nX,nY];
}

class Polygon
{
    constructor()
    {
        this.m_scale = 1;

        this.m_posX = 0 * grid;
        this.m_posY = 0 * grid;

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

    draw(points)
    {
        for(let i = 0; i < points.length; i++)
        {
            points[i] = rotate(points[i],this.m_angle);
            points[i] = [points[i][0]*grid,points[i][1]*grid];
            points[i] = [Math.round(points[i][0]*this.m_scale),Math.round(points[i][1]*this.m_scale)];
            points[i] = [points[i][0]+this.m_posX,points[i][1]+this.m_posY];
        }
        context.beginPath();
        context.moveTo(points[0][0],points[0][1]);
        for(let j = 1; j < points.length; j++)
        {
            context.lineTo(points[j][0],points[j][1]);
        }
        context.lineTo(points[0][0],points[0][1]);
        context.fill();
        context.stroke();
    }

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

    thrust(power = this.m_movementSpeed)
    {
        this.m_thrust = power;
    }

    move()
    {
        let a = this.m_thrust * Math.cos(degToRad(this.m_movementAngle));
        let b = this.m_thrust * Math.sin(degToRad(this.m_movementAngle));

        this.m_velX += b;
        this.m_velY -= a;

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

        this.m_posX += this.m_velX;
        this.m_posY += this.m_velY;

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
    
        this.m_posX = Math.round(this.m_posX);
        this.m_posY = Math.round(this.m_posY);
    }
}

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
        super.rotate(rotationSpeed);
        this.m_movementAngle = this.m_angle;
    }

    draw()
    {
        super.draw(this.m_points.slice(0,4));

        if(this.m_drawFlame)
        {
            //context.save();
            //context.fillStyle = "yellow";
            super.draw(this.m_points.slice(4));
            //context.restore();
        }
    }
}

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

        this.m_points.push([-0.5,-1.5]);
        this.m_points.push([0.5,-1.5]);
        this.m_points.push([1,-0.5]);
        this.m_points.push([2.5,0.5]);
        this.m_points.push([1,1.5]);
        this.m_points.push([-1,1.5]);
        this.m_points.push([-2.5,0.5]);
        this.m_points.push([-1,-0.5]);

        this.m_points.push([-2.5,0.5]);
        this.m_points.push([-1,-0.5]);
        this.m_points.push([1,-0.5]);
        this.m_points.push([2.5,0.5]);
    }

    draw()
    {
        super.draw(this.m_points.slice(0,8));
        super.draw(this.m_points.slice(8));
    }
}

class BigSaucer extends Saucer
{
    constructor(X,Y)
    {
        super(X,Y);
        this.m_scale = 1.25;
    }
}

class SmallSaucer extends Saucer
{
    constructor(X,Y)
    {
        super(X,Y);
        this.m_scale = 0.75;
    }
}

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
        super.draw(this.m_points.slice(0));
    }
}

let player = new Ship(playerStartX,playerStartY);

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

function drawCircle(X,Y,drawX,drawY)
{
    context.save();
    context.fillStyle = 'white';

    context.beginPath();
    context.arc((X*grid)+drawX,(Y*grid)+drawY,2,0,2*Math.PI);
    context.fill();

    context.restore();
}

function drawLine(X1,Y1,X2,Y2,drawX,drawY)
{
    context.beginPath();
    context.moveTo((X1*grid)+drawX,(Y1*grid)+drawY);
    context.lineTo((X2*grid)+drawX,(Y2*grid)+drawY);
    context.stroke();
}
