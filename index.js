const SCALE = 4; 
const WIDTH = 280; 
const HEIGHT = 150; 
const NUM_OF_RAYS = 70;
const WINDOW_HEIGHT_3D = 80;  


var canvas; 
var context; 

var playerPosX = 20;
var playerPosY = 20; 
var playerRot = 0; 
var playerDeltaX = Math.cos(playerRot) * 5; 
var playerDeltaY = Math.sin(playerRot) * 5;

var pressedKeys = {};
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] = true; }


var mapX = 8; 
var mapY = 8; 
var mapScale = 16; 
var map = [
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 0, 1, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 3, 3, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 2, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 
]

var colorMap = [
    [], 
    [0, 102, 204],
    [204, 0, 0], 
    [0, 204, 0]
]

window.onload = function(){
    console.log("bin da"); 

    canvas = document.getElementById("mainWindow");
    context = canvas.getContext("2d");

    // Set the canvas width and height
    canvas.width = WIDTH * SCALE;
    canvas.height = HEIGHT* SCALE;

    // Disable antialiasing and set image smoothing to "pixelated"
    context.imageSmoothingEnabled = false;
    context.imageSmoothingQuality = "pixelated";


    
    setInterval(update, 40); 
}

// mainloop gets called every 40 ms
function update(){
    clearBackground();
    drawMap();
    movePlayer();
    drawPlayer();
    drawRay3D(); 
}

//takes pixel at virtual pixel and places at screen pixel
function drawPixel(x, y, color){
    context.fillStyle = color;
    context.fillRect(x*SCALE-SCALE/2, y*SCALE-SCALE/2, SCALE/2, SCALE/2);
}

function drawLine(x1, y1, x2, y2, color, width=1) {
    context.beginPath();
    context.strokeStyle = color;
    context.moveTo(x1*SCALE, y1*SCALE); // Move to the starting point
    context.lineTo(x2*SCALE, y2*SCALE); // Draw a line to the ending point
    context.lineWidth = SCALE * width;
    context.stroke(); // Actually draw the line
}

function drawLineNoScale(x1, y1, x2, y2, color) {
    context.beginPath();
    context.strokeStyle = color;
    context.moveTo(x1, y1); // Move to the starting point
    context.lineTo(x2, y2); // Draw a line to the ending point
    //context.lineWidth = SCALE;
    context.stroke(); // Actually draw the line
}


function clearBackground(){
        // Set the fill color to grey
        context.fillStyle = "grey";

        // Draw a red rectangle covering the canvas
        context.fillRect(0, 0, canvas.width, canvas.height);

        //draw bottom and ceiling of the 3D view
        context.fillStyle = "rgb(64, 64, 64)";
        context.fillRect((mapScale*mapX+5)*SCALE-SCALE, 0, NUM_OF_RAYS*2*SCALE, WINDOW_HEIGHT_3D*SCALE/2);

        context.fillStyle = "rgb(80, 80, 80)";
        context.fillRect((mapScale*mapX+5)*SCALE-SCALE, WINDOW_HEIGHT_3D*SCALE/2, NUM_OF_RAYS*2*SCALE, WINDOW_HEIGHT_3D*SCALE/2);
}

function drawPlayer(){
    drawPixel(playerPosX, playerPosY, "blue"); 
    //view line 
    drawLine(playerPosX, playerPosY, playerPosX+playerDeltaX*5, playerPosY+playerDeltaY*5, "red");

}

function drawMap(){
    for(var y = 0; y<mapY; y+=1)
    {
        for(var x = 0; x<mapX; x+=1){
            if(map[y*mapX+x])
                context.fillStyle = "white";
            else
                context.fillStyle = "black";
            context.fillRect(x*SCALE*mapScale+1, y*SCALE*mapScale+1, SCALE*mapScale-1, SCALE*mapScale-1);
        }
    }
}

function recalcAngleUnitCircle(angle){
    while(angle < 0){
        angle+=Math.PI*2; 
    }
    while(angle > Math.PI*2){
        angle-=Math.PI*2; 
    }
    return angle; 
}

function drawRay3D(){
    var rayAngle = recalcAngleUnitCircle(playerRot - Math.PI*2/360*NUM_OF_RAYS/2); 
    var rayX, rayY, offsetX, offsetY, mapRayX, mapRayY;
    var mapWallHitIndex; 
    var depthOfField = 0; // cunting how "far" we already looked
    var finalDistanceRay; 
    var hitVerticalWall; //true or false, needed for shading
    var finalWallHit; 

    //check horizontal lines
    for(var i=0; i<NUM_OF_RAYS; i+=1){
        hitVerticalWall = true; 
        rayAngle = recalcAngleUnitCircle(rayAngle += Math.PI*2/360);
        var distanceHorizontal = 100000;
        var horizontalX = playerPosX;
        var horizontalY = playerPosY;
        depthOfField = 0; 
        var aTan = -1/Math.tan(rayAngle);
        if(rayAngle > Math.PI){ //player looking "up"
            rayY = Math.floor(playerPosY) - (Math.floor(playerPosY) % mapScale) - 0.00001; //get the y position of next grid line
            rayX = (playerPosY-rayY) * aTan + playerPosX;
            offsetY = -mapScale;
            offsetX = -offsetY * aTan;  
        }
        if(rayAngle < Math.PI){ //player looking "down" 
            rayY = Math.floor(playerPosY) - (Math.floor(playerPosY) % mapScale) + mapScale; //get the y position of next grid line
            rayX = (playerPosY-rayY) * aTan + playerPosX;
            offsetY = mapScale;
            offsetX = -offsetY * aTan;  
        }
        if(rayAngle == 0 || rayAngle == Math.PI){ //looking exactly to the side (Can never collide with y grid)
            rayY = playerPosY;
            rayX = playerPosX;
            depthOfField = 8; 
        } 
        while(depthOfField < 8){
            mapRayX = (Math.floor(rayX) - (Math.floor(rayX) % mapScale)) /mapScale;
            mapRayY = (Math.floor(rayY) - (Math.floor(rayY) % mapScale)) /mapScale;
            mapWallHitIndex = mapRayY * mapX + mapRayX; 
            if(mapWallHitIndex > 0 && mapWallHitIndex < mapX*mapY && map[mapWallHitIndex] > 0){
                horizontalX = rayX; 
                horizontalY = rayY; 
                distanceHorizontal = getDistance(playerPosX, playerPosY, rayX, rayY, rayAngle); 
                depthOfField = 8; // we are done / found the hit wall
            } else {
                rayX += offsetX; 
                rayY += offsetY;
                depthOfField += 1; 
            }
        }
        finalWallHit = mapWallHitIndex; 
        //context.lineWidth = 10;
        //drawLine(playerPosX, playerPosY, rayX, rayY, "green");

        //check vertical lines
        depthOfField = 0;
        var distanceVertical = 100000;
        var verticalX = playerPosX;
        var verticalY = playerPosY;
        
        var nTan = -Math.tan(rayAngle);
        if(rayAngle > Math.PI*0.5 && rayAngle < Math.PI*1.5 ){ //player looking "left"
            rayX = Math.floor(playerPosX) - (Math.floor(playerPosX) % mapScale) - 0.00001; //get the y position of next grid line
            rayY = (playerPosX-rayX) * nTan + playerPosY;
            offsetX = -mapScale;
            offsetY = -offsetX * nTan;  
        }
        if(rayAngle < Math.PI*0.5 || rayAngle > Math.PI*1.5){ //player looking "right" 
            rayX = Math.floor(playerPosX) - (Math.floor(playerPosX) % mapScale) + mapScale; //get the y position of next grid line
            rayY = (playerPosX-rayX) * nTan + playerPosY;
            offsetX = mapScale;
            offsetY = -offsetX * nTan;  
        }
        if(rayAngle == Math.PI*0.5 || rayAngle == Math.PI*1.5){ //looking exactly to the side (Can never collide with y grid)
            rayY = playerPosY;
            rayX = playerPosX;
            depthOfField = 8; 
        } 
        while(depthOfField < 8){
            mapRayX = (Math.floor(rayX) - (Math.floor(rayX) % mapScale)) /mapScale;
            mapRayY = (Math.floor(rayY) - (Math.floor(rayY) % mapScale)) /mapScale;
            mapWallHitIndex = mapRayY * mapX + mapRayX; 
            if(mapWallHitIndex > 0 && mapWallHitIndex < mapX*mapY && map[mapWallHitIndex] > 0){
                verticalX = rayX; 
                verticalY = rayY; 
                distanceVertical = getDistance(playerPosX, playerPosY, rayX, rayY, rayAngle);
                finalDistanceRay = distanceVertical; 
                depthOfField = 8; // we are done / found the hit wall
            } else {
                rayX += offsetX; 
                rayY += offsetY;
                depthOfField += 1; 
            }
        }
        if(distanceHorizontal < distanceVertical){
            rayX = horizontalX; 
            rayY = horizontalY;
            finalDistanceRay = distanceHorizontal;
            hitVerticalWall = false; 
        } else {
            finalWallHit = mapWallHitIndex;
        }

        //draw the visualizer line
        //context.lineWidth = SCALE;
        drawLine(playerPosX, playerPosY, rayX, rayY, "blue");

        //draw the 3d view column
        var angleDiff = recalcAngleUnitCircle(playerRot-rayAngle);
        finalDistanceRay = finalDistanceRay * Math.cos(angleDiff);
        var lineHeight = WINDOW_HEIGHT_3D*mapScale / finalDistanceRay;
        if(lineHeight > WINDOW_HEIGHT_3D) lineHeight = WINDOW_HEIGHT_3D; 
        var lineOffset = (WINDOW_HEIGHT_3D - lineHeight) / 2;

        
        var colorArr = colorMap[map[finalWallHit]];

        var color = hitVerticalWall ? `rgb(${colorArr[0]}, ${colorArr[1]}, ${colorArr[2]})` : `rgb(${colorArr[0]/2}, ${colorArr[1]/2}, ${colorArr[2]/2})`;
        drawLine(mapScale*mapX+5+(i*2), lineOffset, mapScale*mapX+5+(i*2), lineHeight+ lineOffset, color, 2); 

    }
}

function getDistance(x1, y1, x2, y2, angel)
{
    return(Math.sqrt((x2-x1)*((x2-x1)) + (y2-y1)*(y2-y1) ));
}

function movePlayer(){
    // button w
    if(pressedKeys["87"]){
        playerPosX += playerDeltaX;
        playerPosY += playerDeltaY; 
    }
    // button s
    if(pressedKeys["83"]){
        playerPosX -= playerDeltaX;
        playerPosY -= playerDeltaY; 
    } 

    // button a
    if(pressedKeys["65"]){
        playerRot-=0.1; 
        if(playerRot < 0) playerRot += 2*Math.PI; 
    }
    // button d
    if(pressedKeys["68"]){  
        playerRot+=0.1; 
        if(playerRot > 2*Math.PI) playerRot -= 2*Math.PI;
    } 
    playerDeltaX = Math.cos(playerRot) * 2; 
    playerDeltaY = Math.sin(playerRot) * 2;
}