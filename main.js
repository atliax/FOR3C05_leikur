function keydown(event)
{
    if(event.keyCode == 37)//vinstri
    {
        player.rotate(true);
    }

    if(event.keyCode == 39)//hægri
    {
        player.rotate(false);
    }

    if(event.keyCode == 38)//upp
    {
        player.m_moving = true;
    }

    if(event.keyCode == 32)//space
    {
        //player.shoot();
    }
}



function keyup(event)
{
    if (event.keyCode == 38){
        player.m_moving = false
    } 
}

class Polygon
{
    constructor()
    {
        this.m_posX = 0 * grid;
        this.m_posY = 0 * grid;
        this.m_moving = false;
        this.m_angle = 0;
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

    rotate(left)
    {
        if(left)
        {
            this.m_angle -= this.m_rotationSpeed;
            if(this.m_angle < 0)
            {
                this.m_angle += 360;
            }
        }
        else
        {
            this.m_angle += this.m_rotationSpeed;
            if(this.m_angle >= 360)
            {
                this.m_angle -= 360;
            }
        }
    }

    move()
    {
        if(this.m_moving)
        {
            let a = this.m_movementSpeed * Math.cos(angleRad(this.m_angle));
            let b = this.m_movementSpeed * Math.sin(angleRad(this.m_angle));
            
            this.m_posX += b;
            this.m_posY -= a;
            
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
}

class Ship extends Polygon
{
    constructor(startX, startY)
    {
        super();

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
        this.m_movementSpeed = 2;
        this.m_rotationSpeed = 1;
        this.m_angle = Math.floor(Math.random()*359);

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

function angleRad(a)
{
    return a * (Math.PI/180);
}

function rotate([X,Y],angle)
{
    let nX = X*Math.cos(angleRad(angle))-Y*Math.sin(angleRad(angle));
    let nY = X*Math.sin(angleRad(angle))+Y*Math.cos(angleRad(angle));
    return [nX,nY];
}

function update()
{
    player.move();
    asteroid.move();
    asteroid.rotate();

    //skoða árekstra hér?

    //hreinsa skjáinn með því að teikna kassa
    context.clearRect(0,0,context.canvas.width,context.canvas.height);
    context.beginPath();
    context.rect(0,0,context.canvas.width,context.canvas.height);
    context.fill();

    player.draw();
    asteroid.draw();
}

let canvas = document.getElementById('mainCanvas');
let context = canvas.getContext('2d');

context.strokeStyle = "white";
context.fillStyle = "black";
context.lineWidth = 1;

let grid = 16;

let playerStartX = context.canvas.width/2;
let playerStartY = context.canvas.height/2;

let asteroidStartX = Math.floor(Math.random()*(context.canvas.width-1));
let asteroidStartY = Math.floor(Math.random()*(context.canvas.height-1));

document.addEventListener("keydown",keydown);
document.addEventListener("keyup",keyup);

let player = new Ship(playerStartX,playerStartY);
let asteroid = new Asteroid(asteroidStartX,asteroidStartY);

let game = setInterval(update, 20);
