canvas = document.getElementById('mainCanvas');
context = canvas.getContext('2d');

let moving = false;

let grid = 16;

let posX = 8*grid;
let posY = 8*grid;

let angle = 0;
let movementSpeed = 5;
let rotationSpeed = 10;

function keydown(event)
{
    if(event.keyCode == 37)
    {
        angle -= rotationSpeed;
        if(angle < 0)
            angle += 360;
    }

    if(event.keyCode == 39)
    {
        angle += rotationSpeed;
        if(angle >= 360)
            angle -= 360;
    }

    if(event.keyCode == 38)
    {
        moving = true;
    }

    document.getElementById('angle').innerHTML = angle.toString();
}

function keyup(event)
{
    if(event.keyCode == 38)
    {
        moving = false;
    }
}

document.addEventListener("keydown",keydown);
document.addEventListener("keyup",keyup);

class Polygon
{
    constructor()
    {
        
    }

    draw()
    {
        
    }
}

class Ship extends Polygon
{

}

class Asteroid extends Polygon
{

}

function angleRad(a)
{
    return a * (Math.PI/180);
}

function rotate([X,Y])
{
    let nX = X*Math.cos(angleRad(angle))-Y*Math.sin(angleRad(angle));
    let nY = X*Math.sin(angleRad(angle))+Y*Math.cos(angleRad(angle));
    return [nX,nY];
}

function draw()
{
    context.clearRect(0,0,context.canvas.width,context.canvas.height);

    context.strokeStyle = "white";
    context.fillStyle = "black";
    context.lineWidth = 1;
    
    context.beginPath();
    context.rect(0,0,context.canvas.width,context.canvas.height);
    context.fill();

    // skipið
    let point1 = [ 0,-1.5];
    let point2 = [ 1, 1.5];
    let point3 = [ 0, 0.5];
    let point4 = [-1, 1.5];

    // "eldurinn"
    let point5 = [-0.5, 1  ];
    let point6 = [ 0  , 1.5];
    let point7 = [ 0.5, 1  ];

    point1 = rotate(point1);
    point2 = rotate(point2);
    point3 = rotate(point3);
    point4 = rotate(point4);
    point5 = rotate(point5);
    point6 = rotate(point6);
    point7 = rotate(point7);

    point1 = [point1[0]*grid,point1[1]*grid];
    point2 = [point2[0]*grid,point2[1]*grid];
    point3 = [point3[0]*grid,point3[1]*grid];
    point4 = [point4[0]*grid,point4[1]*grid];
    point5 = [point5[0]*grid,point5[1]*grid];
    point6 = [point6[0]*grid,point6[1]*grid];
    point7 = [point7[0]*grid,point7[1]*grid];

    point1 = [point1[0]+posX,point1[1]+posY];
    point2 = [point2[0]+posX,point2[1]+posY];
    point3 = [point3[0]+posX,point3[1]+posY];
    point4 = [point4[0]+posX,point4[1]+posY];
    point5 = [point5[0]+posX,point5[1]+posY];
    point6 = [point6[0]+posX,point6[1]+posY];
    point7 = [point7[0]+posX,point7[1]+posY];

    context.beginPath();

    context.moveTo(point1[0],point1[1]);
    context.lineTo(point2[0],point2[1]);
    context.lineTo(point3[0],point3[1]);
    context.lineTo(point4[0],point4[1]);
    context.lineTo(point1[0],point1[1]);

    //context.fillStyle="yellow";
    //context.fill();
    if(moving)
    {
        //context.beginPath();
        context.moveTo(point5[0],point5[1]);
        context.lineTo(point6[0],point6[1]);
        context.lineTo(point7[0],point7[1]);
        context.lineTo(point3[0],point3[1]);
        context.lineTo(point5[0],point5[1]);
        //context.fillStyle = "orange";
        //context.fill();
    }

    context.stroke();

    if(moving)
    {
        moveShip();
    }
}

function moveShip()
{
    let a = movementSpeed * Math.cos(angleRad(angle));
    let b = movementSpeed * Math.sin(angleRad(angle));

    posX += b;
    posY -= a;

    if(posY < 0)
        posY += context.canvas.height;

    if(posY > context.canvas.height)
        posY -= context.canvas.height;

    if(posX < 0)
        posX += context.canvas.width;

    if(posX > context.canvas.width)
        posX -= context.canvas.width;


    posX = Math.round(posX);
    posY = Math.round(posY);

    document.getElementById('aside').innerHTML = a.toString();
    document.getElementById('bside').innerHTML = b.toString();
    document.getElementById('posX').innerHTML = posX.toString();
    document.getElementById('posY').innerHTML = posY.toString();
}

let game = setInterval(draw, 16);
