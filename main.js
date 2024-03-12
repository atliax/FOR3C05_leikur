const canvas = document.getElementById('mainCanvas');
const context = canvas.getContext('2d');

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_SPACE = 32;
const KEY_S = 83;

let keys = {
    KEY_LEFT: false,
    KEY_RIGHT: false,
    KEY_UP: false,
    KEY_DOWN: false,
    KEY_SPACE: false,
    KEY_S: false
};

const NUM_STARS = 40;

context.strokeStyle = "white";
context.fillStyle = "black";
context.lineWidth = 1;

let grid = 10;

let playerStartX = context.canvas.width/2;
let playerStartY = context.canvas.height/2;
let playerSpeed = 0.3;
let playerMaxSpeed = 5;
let playerRotationSpeed = 15;

let asteroids = [];

let generatedBackground = false;
let storedBackground;

document.addEventListener("keydown",keydown);
document.addEventListener("keyup",keyup);

let game = setInterval(update, 20);

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
}

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
        event.keyCode == KEY_S)
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
        event.keyCode == KEY_S)
    {
        keys[event.keyCode] = false;
    }
}

function randomShape(X,Y,nodes,minR,maxR)
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
            this.m_size = 10;
        }

        this.m_minrad = Math.round(this.m_size/3);

        this.m_points = [...randomShape(Math.round(X/grid),Math.round(Y/grid),10,this.m_minrad,this.m_size)];
    }

    draw()
    {
        super.draw(this.m_points.slice(0));
    }
}

let player = new Ship(playerStartX,playerStartY);
