const canvas = document.getElementById('mainCanvas');
const context = canvas.getContext('2d');

const KEY_LEFT = 37;
const KEY_RIGHT = 39;
const KEY_UP = 38;
const KEY_DOWN = 40;
const KEY_SPACE = 32;

context.strokeStyle = "white";
context.fillStyle = "black";
context.lineWidth = 1;

let grid = 16;

let playerStartX = context.canvas.width/2;
let playerStartY = context.canvas.height/2;
let playerSpeed = 0.5;
let playerRotationSpeed = 15;

let asteroidStartX = Math.floor(Math.random()*(context.canvas.width-1));
let asteroidStartY = Math.floor(Math.random()*(context.canvas.height-1));

document.addEventListener("keydown",keydown);
document.addEventListener("keyup",keyup);

let game = setInterval(update, 20);

function update()
{
    player.move();
    asteroid.move();
    asteroid.rotate();
    asteroid2.move();
    asteroid2.rotate();

    //skoða árekstra hér?

    //hreinsa skjáinn með því að teikna kassa
    context.clearRect(0,0,context.canvas.width,context.canvas.height);
    context.beginPath();
    context.rect(0,0,context.canvas.width,context.canvas.height);
    context.fill();

    player.draw();
    asteroid.draw();
    asteroid2.draw();
}

function keydown(event)
{
    if(event.keyCode == KEY_LEFT)//vinstri
    {
        player.rotate(-player.m_rotationSpeed);
    }

    if(event.keyCode == KEY_RIGHT)//hægri
    {
        player.rotate(player.m_rotationSpeed);
    }

    if(event.keyCode == KEY_UP)//upp
    {
        player.thrust();
        player.m_moving = true;
    }

    if(event.keyCode == KEY_SPACE)//space
    {
        //player.shoot();
    }
}

function keyup(event)
{
    if (event.keyCode == 38){
        player.thrust(0);
        player.m_moving = false
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

        this.m_moving = false;
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

        this.m_posX = startX;
        this.m_posY = startY;

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

        if(this.m_moving)
        {
            super.draw(this.m_points.slice(4));
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
        this.m_moving = true;
        this.m_movementSpeed = 1;
        this.m_rotationSpeed = 1;
        this.m_angle = Math.floor(Math.random()*359);
        this.m_movementAngle = Math.floor(Math.random()*359);

        // kannski 10, 5 og 2 fyrir stærðir?
        this.m_size = 5;

        this.m_minrad = Math.round(this.m_size/3);

        this.m_points = [...randomShape(Math.round(X/grid),Math.round(Y/grid),10,this.m_minrad,this.m_size)];
    }

    draw()
    {
        super.draw(this.m_points.slice(0));
    }
}

let player = new Ship(playerStartX,playerStartY);
let asteroid = new Asteroid(asteroidStartX,asteroidStartY);
let asteroid2 = new Asteroid(asteroidStartX,asteroidStartY);
