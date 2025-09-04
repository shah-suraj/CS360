////////////////////////////////////////////////////////////////////////
// A simple WebGL program to draw simple 2D shapes.
//


/*  
  Assignment - 1
  Name :- Shah Suraj Kumar
  Roll No. :- 220996
*/

var gl;
var color;
var matrixStack = [];
var mMatrix = mat4.create();
var uMMatrixLocation;
var aPositionLocation;
var uColorLoc;
var mode = 'solid';  // mode for drawing (By Default "Solid")

var animation;

// for back and forth motion of the boat
let translationX = -0.6; 
let translationX1 = -0.4; 
const translationSpeed = 0.01;
const translationRange = 0.9; 

let direction1 = 1; // Direction for first boat
let direction2 = 1; // Direction for second boat

// for car movement
let carTranslationX = -0.8;
const carTranslationSpeed = 0.005;
const carTranslationRange = 1.6;
let carDirection = 1;

// for rotation of the windmill and sun
let rotationAngle = 0.0;
const rotationSpeed = 0.023;

// for blinking stars
let starBlinkTime = 0.0;
const starBlinkSpeed = 0.06;

// for drawing the circle
const numSegments = 50; 
const angleIncrement = (Math.PI * 2) / numSegments;

const starSizes = [
    0.02,  
    0.04,  
    0.025, 
    0.025, 
    0.02   
];

const vertexShaderCode = `#version 300 es
in vec2 aPosition;
uniform mat4 uMMatrix;

void main() {
    gl_Position = uMMatrix*vec4(aPosition,0.0,1.0);
    gl_PointSize = 5.0;
}`;

const fragShaderCode = `#version 300 es
precision mediump float;
out vec4 fragColor;
uniform vec4 color;

void main() {
    fragColor = color;
}`;

function pushMatrix(stack, m) {     //necessary because javascript only does shallow push
    var copy = mat4.create(m);
    stack.push(copy);
}

function popMatrix(stack) {
    if (stack.length > 0) return stack.pop();
    else console.log("stack has no matrix to pop!");
}

function degToRad(degrees) {
    return (degrees * Math.PI) / 180;
}

function vertexShaderSetup(vertexShaderCode) {
    shader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shader, vertexShaderCode);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function fragmentShaderSetup(fragShaderCode) {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shader, fragShaderCode);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

function initShaders() {
    shaderProgram = gl.createProgram();
    var vertexShader = vertexShaderSetup(vertexShaderCode);
    var fragmentShader = fragmentShaderSetup(fragShaderCode);

    // attach the shaders
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    //link the shader program
    gl.linkProgram(shaderProgram);

    // check for compilation and linking status
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.log(gl.getShaderInfoLog(vertexShader));
        console.log(gl.getShaderInfoLog(fragmentShader));
    }

    //finally use the program.
    gl.useProgram(shaderProgram);

    return shaderProgram;
}

function initGL(canvas) {
    try {
        gl = canvas.getContext("webgl2"); // the graphics webgl2 context
        gl.viewportWidth = canvas.width; // the width of the canvas
        gl.viewportHeight = canvas.height; // the height
    } catch (e) {}
    if (!gl) {
        alert("WebGL initialization failed");
    }
}

// drawing a square
function initSquareBuffer() {
    // buffer for point locations
    const sqVertices = new Float32Array([
        0.5, 0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    ]);
    sqVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, sqVertices, gl.STATIC_DRAW);
    sqVertexPositionBuffer.itemSize = 2;
    sqVertexPositionBuffer.numItems = 4;

    // buffer for point indices
    const sqIndices = new Uint16Array([0, 1, 2, 0, 2, 3]);
    sqVertexIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sqIndices, gl.STATIC_DRAW);
    sqVertexIndexBuffer.itemsize = 1;
    sqVertexIndexBuffer.numItems = 6;
}

function drawSquare(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, sqVertexPositionBuffer);
    gl.vertexAttribPointer(aPositionLocation, sqVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sqVertexIndexBuffer);
    gl.uniform4fv(uColorLoc, color);

    // now draw the square
    // show the solid view
    if (mode === 'solid') {
        gl.drawElements(gl.TRIANGLES, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    // show the wireframe view
    else if (mode === 'wire') {
        gl.drawElements(gl.LINE_LOOP, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    // show the point view
    else if (mode === 'point') {
        gl.drawElements(gl.POINTS, sqVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
    }    
}

// drawing a triangle
function initTriangleBuffer() {
    // buffer for point locations
    const triangleVertices = new Float32Array([0.0, 0.5, -0.5, -0.5, 0.5, -0.5]);
    triangleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    triangleBuf.itemSize = 2;
    triangleBuf.numItems = 3;

    // buffer for point indices
    const triangleIndices = new Uint16Array([0, 1, 2]);
    triangleIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, triangleIndices, gl.STATIC_DRAW);
    triangleIndexBuf.itemsize = 1;
    triangleIndexBuf.numItems = 3;
}

function drawTriangle(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuf);
    gl.vertexAttribPointer(aPositionLocation, triangleBuf.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuf);
    gl.uniform4fv(uColorLoc, color);

    // now draw the triangle
    if (mode === 'solid') {
        gl.drawElements(gl.TRIANGLES, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'wire') {
        gl.drawElements(gl.LINE_LOOP, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'point') {
        gl.drawElements(gl.POINTS, triangleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}

// drawing a circle
function initCircleBuffer() {
    // buffer for point locations
    const positions = [0, 0]; // take the center of the circle
    for (let i = 1; i <= numSegments; i++) {
        positions.push(Math.cos(angleIncrement * i), Math.sin(angleIncrement * i));
    }

    const circleVertices = new Float32Array(positions);
    circleBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.bufferData(gl.ARRAY_BUFFER, circleVertices, gl.STATIC_DRAW);
    circleBuf.itemSize = 2;
    circleBuf.numItems = numSegments + 1;

    // Create index buffer
    const indices = Array.from({ length: numSegments }, (_, i) => [0, i, i + 1]).flat();
    indices.push(0, numSegments, 1);

    // buffer for point indices
    const circleIndices = new Uint16Array(indices);
    circleIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, circleIndices, gl.STATIC_DRAW);
    circleIndexBuf.itemsize = 1;
    circleIndexBuf.numItems = indices.length;
}

function drawCircle(color, mMatrix) {
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, circleBuf);
    gl.vertexAttribPointer(aPositionLocation, circleBuf.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, circleIndexBuf);
    gl.uniform4fv(uColorLoc, color);

    // now draw the circle
    if (mode === 'solid') {
        gl.drawElements(gl.TRIANGLES, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'wire') {
        gl.drawElements(gl.LINE_LOOP, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'point') {
        gl.drawElements(gl.POINTS, circleIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}

// this function is for creating the rays of the sun
function initRayBuffer() {
    const positions = [0, 0];
    const segments = 8;
    const d = Math.PI * 2;

    let i = 1;
    while (i <= segments) {
        const angle = d * i / segments;
        positions.push(Math.cos(angle), Math.sin(angle));
        i++;
    }

    const rayVertices = new Float32Array(positions);
    rayBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, rayBuf);
    gl.bufferData(gl.ARRAY_BUFFER, rayVertices, gl.STATIC_DRAW);
    rayBuf.itemSize = 2;
    rayBuf.numItems = positions.length / 2;

    const indexes = [];
    i = 1;
    while (i <= segments) {
        indexes.push(0, i);
        i++;
    }
    const rayIndices = new Uint16Array(indexes);
    rayIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rayIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rayIndices, gl.STATIC_DRAW);
    rayIndexBuf.itemSize = 1;
    rayIndexBuf.numItems = indexes.length;
}


function drawRays(color, mMatrix) {
    // upload matrix + color
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniform4fv(uColorLoc, color);

    // position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, rayBuf);
    gl.vertexAttribPointer(aPositionLocation, rayBuf.itemSize, gl.FLOAT, false, 0, 0);

    // index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, rayIndexBuf);

    // choose primitive type in one line
    const primitive = (mode === 'point') ? gl.POINTS : gl.LINE_STRIP;

    // draw call
    gl.drawElements(primitive, rayIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
}


// this function is for creating the blades of the windmill (easier to rotate)
function initFanBladesBuffer() {
    // buffer for point locations
    const positions = [0, 0];
    const segments = 16;
    const d = Math.PI * 2;

    let i = 0;
    while (i < segments) {
        const angle = d * i / segments;
        positions.push(Math.cos(angle), Math.sin(angle));
        i++;
    }

    const bladeVertices = new Float32Array(positions);
    bladeBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuf);
    gl.bufferData(gl.ARRAY_BUFFER, bladeVertices, gl.STATIC_DRAW);
    bladeBuf.itemSize = 2;
    bladeBuf.numItems = 9;

    // Create index buffer
    const idx = [];
    i = 0;
    while (i < 15) {
        idx.push(0, i + 1, i + 2);
        i += 4;
    }

    const bladeIndices = new Uint16Array(idx);
    bladeIndexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bladeIndexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, bladeIndices, gl.STATIC_DRAW);
    bladeIndexBuf.itemSize = 1;
    bladeIndexBuf.numItems = idx.length;
}


function drawFanBlades(color, mMatrix) {
    color = [0.67, 0.67, 0.1, 1.0];
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);

    // buffer for point locations
    gl.bindBuffer(gl.ARRAY_BUFFER, bladeBuf);
    gl.vertexAttribPointer(aPositionLocation, bladeBuf.itemSize, gl.FLOAT, false, 0, 0);

    // buffer for point indices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bladeIndexBuf);
    gl.uniform4fv(uColorLoc, color);

    // now draw the circle
    if (mode === 'solid') {
        gl.drawElements(gl.TRIANGLE_FAN, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'wire') {
        gl.drawElements(gl.LINE_LOOP, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
    else if (mode === 'point') {
        gl.drawElements(gl.POINTS, bladeIndexBuf.numItems, gl.UNSIGNED_SHORT, 0);
    }
}

function drawSky() {
    
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];  // black colour
    // local translation operation for the square
    mMatrix = mat4.translate(mMatrix, [0.0, 0.5, 0]);
    // local scale operation for the square
    mMatrix = mat4.scale(mMatrix, [3.0, 1.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

// The rotation angle is taken as input for animation
function drawMoon(rotationAngle) {
    // Draw rotating rays around the moon
    pushMatrix(matrixStack, mMatrix);
    color = [0.8, 0.9, 0.9, 1]; 
    mMatrix = mat4.translate(mMatrix, [-0.71, 0.83, 0]);
    mMatrix = mat4.scale(mMatrix, [0.13, 0.13, 1.0]); 
    mMatrix = mat4.rotate(mMatrix, rotationAngle, [0, 0, 1]); // Rotate the rays
    drawRays(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
    
    // Draw Circle

    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0.9, 0.9, 1]; 
    mMatrix = mat4.translate(mMatrix, [-0.71, 0.83, 0]);
    mMatrix = mat4.scale(mMatrix, [0.1, 0.1, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawCloud() {
    drawCloudPart([-0.8, 0.55, 0], [0.23, 0.12, 1.0], [0.75, 0.75, 0.75, 1.0]);
    drawCloudPart([-0.55, 0.52, 0], [0.18, 0.1, 1.0], [0.0, 0.0, 0.0, 0.0]);
    drawCloudPart([-0.33, 0.52, 0], [0.09, 0.05, 1.0], [0.75, 0.75, 0.75, 1.0]);
}

function drawCloudPart(translation, scale, color) {
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, translation);
    mMatrix = mat4.scale(mMatrix, scale);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawStars() {

    const starPositions = [
        [0.55, 0.9],   
        [0.35, 0.8],   
        [-0.2, 0.75],  
        [-0.05, 0.65], 
        [-0.1, 0.55]   
    ];
    const starVertices = new Float32Array([
        0.0, 0.8, -0.15, 0.0, 0.15, 0.0,
        0.0, -0.8, -0.15, 0.0, 0.15, 0.0,
        0.8, 0.0, 0.0, -0.15, 0.0, 0.15,
        -0.8, 0.0, 0.0, -0.15, 0.0, 0.15
    ]);
    const starIndices = new Uint16Array([0,1,2,3,4,5,6,7,8,9,10,11]);
    const starBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, starVertices, gl.STATIC_DRAW);
    const starIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, starIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, starIndices, gl.STATIC_DRAW);

    let i = 0;
    while (i < starPositions.length) {
        const offsetX = -0.01;  
        const offsetY = 0.01
        const x = starPositions[i][0] + offsetX;
        const y = starPositions[i][1] + offsetY;

        const blink = Math.sin(starBlinkTime) * 0.3 + 0.7;
        const scale = starSizes[i] * (Math.sin(starBlinkTime * 0.8) * 0.2 + 1.0);

        mat4.identity(mMatrix);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [x, y, 0]);
        mMatrix = mat4.scale(mMatrix, [scale, scale, 1.0]);

        gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
        gl.uniform4fv(uColorLoc, [1, 1, 1, blink]);
        gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);

        if (mode === "solid") gl.drawElements(gl.TRIANGLES, 12, gl.UNSIGNED_SHORT, 0);
        else if (mode === "wire") gl.drawElements(gl.LINE_LOOP, 12, gl.UNSIGNED_SHORT, 0);
        else gl.drawElements(gl.POINTS, 12, gl.UNSIGNED_SHORT, 0);

        mMatrix = popMatrix(matrixStack);
        i++;
    }
}
function drawGround() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.0, 0.8, 0.2, 0.8];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.6, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 1.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

// for drawing lines on the river
function drawLines(move = false, x = 0, y = 0) {
    mat4.identity(mMatrix);

    if (move) {
        mMatrix = mat4.translate(mMatrix, [x, y, 0]);
    }
    const lineColor = [0.9, 0.9, 0.9, 0.8];
    const linePositions = [
        [-0.7, -0.15],
        [0.05, -0.10],
        [0.8, -0.25]
    ];
    for (let i = 0; i < linePositions.length; i++) {
        const [lx, ly] = linePositions[i];

        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [lx, ly, 0]);
        mMatrix = mat4.rotate(mMatrix, 4.71, [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [0.003, 0.4, 1.0]);
        drawSquare(lineColor, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }
}
function drawMountain(t_x1, t_y1, s_x, s_y, t_x2 = 0, t_y2 = 0, single = false) {
    const mainColor   = single ? [0.55, 0.35, 0.2, 1.0] : [0.5, 0.3, 0.15, 1.0];
    const shadowColor = [0.35, 0.2, 0.1, 1.0];

    const draw = (tx, ty, color, rotate = 0) => {
        mat4.identity(mMatrix);
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);
        if (rotate) mMatrix = mat4.rotate(mMatrix, rotate, [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [s_x, s_y, 1.0]);
        drawTriangle(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
    };

    draw(t_x1, t_y1, mainColor);
    if (!single) draw(t_x2, t_y2, shadowColor, 6.5);
}


function drawRiver() {
    // --- draw river base ---
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    const riverColor = [0.0, 0.1, 0.9, 0.8];
    mMatrix = mat4.translate(mMatrix, [0.0, -0.17, 0]);
    mMatrix = mat4.scale(mMatrix, [3.0, 0.25, 1.0]);
    drawSquare(riverColor, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // --- draw river lines ---
    const lineR = 0.94, lineG = 0.94, lineB = 0.94, lineA = 0.8;
    const lineColor = [lineR, lineG, lineB, lineA];

    const linePositions = [];
    linePositions.push([-0.7, -0.15]);
    linePositions.push([0.05, -0.10]);
    linePositions.push([0.8, -0.25]);

    for (let i = 0; i < linePositions.length; i++) {
        const x = linePositions[i][0];
        const y = linePositions[i][1];
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [x, y, 0]);
        mMatrix = mat4.rotate(mMatrix, 4.7, [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [0.0025, 0.4, 1.0]);
        drawSquare(lineColor, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }
}


function drawRoad() {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    pushMatrix(matrixStack, mMatrix);
    color = [0.30, 0.50, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [0.6, -0.8, 0]);
    mMatrix = mat4.rotate(mMatrix, 7.2, [0, 0, 1]);
    mMatrix = mat4.scale(mMatrix, [1.6, 2, 1.0]);
    drawTriangle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawTrees(move = false, t_x = 0, t_y = 0, s_x = 1.0, s_y = 1.0) {
    mat4.identity(mMatrix);

    if (move) {
        mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
        mMatrix = mat4.scale(mMatrix, [s_x, s_y, 1.0]);
    }

    let triglData = [
        [[0.30, 0.41, 0, 0.9], [0.55, 0.45], [0.35, 0.3]],
        [[0.38, 0.51, 0, 0.9], [0.55, 0.50], [0.375, 0.3]],
        [[0.45, 0.60, 0, 0.9], [0.55, 0.55], [0.4, 0.3]]
    ];

    let i = 0;
    while (i < triglData.length) {
        pushMatrix(matrixStack, mMatrix);
        color = triglData[i][0];
        let [tx, ty] = triglData[i][1];
        let [sx, sy] = triglData[i][2];
        mMatrix = mat4.translate(mMatrix, [tx, ty, 0]);
        mMatrix = mat4.scale(mMatrix, [sx, sy, 1.0]);
        drawTriangle(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
        i++;
    }

    pushMatrix(matrixStack, mMatrix);
    color = [0.57, 0.36, 0.15, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.55, 0.14, 0]);
    mMatrix = mat4.scale(mMatrix, [0.04, 0.33, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

function drawBoat(tX, tX1, secondBoat = false) {
    mat4.identity(mMatrix);

    if (secondBoat) {
        mMatrix = mat4.translate(mMatrix, [tX1, 0, 0]);
        mMatrix = mat4.scale(mMatrix, [0.5, 0.5, 1]);
    } else {
        mMatrix = mat4.translate(mMatrix, [tX, 0, 0]);
    }

    let boatParts = [
        { c: [0.83, 0.83, 0.83, 1], t: [0, -0.15], r: 0,    s: [0.18, 0.06], f: drawSquare },
        { c: [0.83, 0.83, 0.83, 1], t: [-0.09, -0.15], r: -3.15, s: [0.1, 0.06], f: drawTriangle },
        { c: [0.83, 0.83, 0.83, 1], t: [0.09, -0.15],  r: -3.15, s: [0.1, 0.06], f: drawTriangle },
        { c: [0, 0, 0, 1], t: [0.01, 0.006],  r: 0, s: [0.01, 0.25], f: drawSquare },
        { c: [0, 0, 0, 1], t: [-0.03, -0.01], r: 5.9, s: [0.005, 0.23], f: drawSquare },
        { c: secondBoat ? [0.5, 0, 0.5, 0.9] : [1, 0, 0, 0.9], 
          t: [0.115, 0.006], r: 4.72, s: [0.2, 0.2], f: drawTriangle }
    ];

    let i = 0;
    while (i < boatParts.length) {
        pushMatrix(matrixStack, mMatrix);
        color = boatParts[i].c;
        mMatrix = mat4.translate(mMatrix, [...boatParts[i].t, 0]);
        if (boatParts[i].r) mMatrix = mat4.rotate(mMatrix, boatParts[i].r, [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [...boatParts[i].s, 1]);
        boatParts[i].f(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
        i++;
    }
}

// rotationAngle is taken as input for animation of the blades
function drawFan(rotationAngle, move = false, t_x = 0, t_y = 0, scale = 1.0) {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    if (move) {
        mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
        mMatrix = mat4.scale(mMatrix, [scale, scale, 1.0]);
    }
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1.0];
    mMatrix = mat4.translate(mMatrix, [0.7, -0.25, 0]);
    // local scale operation for the square
    mMatrix = mat4.scale(mMatrix, [0.03, 0.55, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // drawing the fan blades
    pushMatrix(matrixStack, mMatrix);
    color = [0.8, 0.75, 0, 1];
    mMatrix = mat4.translate(mMatrix, [0.7, 0.06, 0]);
    mMatrix = mat4.scale(mMatrix, [0.2, 0.2, 1.0]);
    // rotating the fan blades (anti-clockwise)
    mMatrix = mat4.rotate(mMatrix, -rotationAngle, [0, 0, 1]);
    drawFanBlades(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0, 0, 0, 1];
    mMatrix = mat4.translate(mMatrix, [0.7, 0.053, 0]);
    mMatrix = mat4.scale(mMatrix, [0.03, 0.03, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}
// Draw house base (gray walls + yellow windows + door)
function drawHouseBase() {
    pushMatrix(matrixStack, mMatrix);
    color = [0.83, 0.83, 0.83, 1];
    mMatrix = mat4.translate(mMatrix, [-0.55, -0.525, 0]);
    mMatrix = mat4.scale(mMatrix, [0.5, 0.25, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    let winX = [-0.7, -0.4];
    for (let i = 0; i < winX.length; i++) {
        pushMatrix(matrixStack, mMatrix);
        color = [0.85, 0.7, 0, 0.9];
        mMatrix = mat4.translate(mMatrix, [winX[i], -0.47, 0]);
        mMatrix = mat4.scale(mMatrix, [0.08, 0.08, 1.0]);
        drawSquare(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }

    pushMatrix(matrixStack, mMatrix);
    mMatrix = mat4.translate(mMatrix, [-0.55, -0.56, 0]);
    mMatrix = mat4.scale(mMatrix, [0.08, 0.18, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

// Main function (identity + call roof + base)
function drawHouse() {
    mat4.identity(mMatrix);
    drawHouseRoof();
    drawHouseBase();
}


// wheels for the car
function drawCar() {
    mat4.identity(mMatrix);

    // roof
    pushMatrix(matrixStack, mMatrix);
    color = [0.07, 0.22, 0.52, 1];
    mMatrix = mat4.translate(mMatrix, [-0.5, -0.75, 0]);
    mMatrix = mat4.scale(mMatrix, [0.15, 0.08, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // window
    pushMatrix(matrixStack, mMatrix);
    color = [0.9, 0.9, 0.95, 1] ;  // near white with slight bluish tint
    mMatrix = mat4.translate(mMatrix, [-0.5, -0.755, 0]);
    mMatrix = mat4.scale(mMatrix, [0.21, 0.08, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    // wheels
    let wPos = [-0.66, -0.34];
    let wCfg = [
        [0.05, [0, 0, 0, 1]],
        [0.035, [0.5, 0.5, 0.5, 1]]
    ];
    for (let i = 0; i < wPos.length; i++) {
        for (let j = 0; j < wCfg.length; j++) {
            pushMatrix(matrixStack, mMatrix);
            let [s, clr] = wCfg[j];
            color = clr;
            mMatrix = mat4.translate(mMatrix, [wPos[i], -0.87, 0]);
            mMatrix = mat4.scale(mMatrix, [s, s, 1.0]);
            drawCircle(color, mMatrix);
            mMatrix = popMatrix(matrixStack);
        }
    }

    // body (trapezoid)
    pushMatrix(matrixStack, mMatrix);
    color = [0.22, 0.45, 0.82, 1];
    mMatrix = mat4.translate(mMatrix, [-0.5, -0.81, 0]);
    mMatrix = mat4.scale(mMatrix, [0.25, 0.0388, 1.0]);
    const t = 0.8;
    const v = new Float32Array([-t, 1, t, 1, 1, -1, -1, -1]);
    gl.uniformMatrix4fv(uMMatrixLocation, false, mMatrix);
    gl.uniform4fv(uColorLoc, color);
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);
    if (mode === 'solid') gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    else if (mode === 'wire') gl.drawArrays(gl.LINE_LOOP, 0, 4);
    else if (mode === 'point') gl.drawArrays(gl.POINTS, 0, 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.deleteBuffer(b);
    mMatrix = popMatrix(matrixStack);
}


function drawBush(move=false, t_x=0, t_y=0, s=0) {
    // initialize the model matrix to identity matrix
    mat4.identity(mMatrix);
    if (move) {
        mMatrix = mat4.translate(mMatrix, [t_x, t_y, 0]);
        mMatrix = mat4.scale(mMatrix, [s, s, 0]);
    }
    pushMatrix(matrixStack, mMatrix);
    color = [0, 0.7, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [-1.05, -0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.077, 0.055, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0, 0.2, 0, 0.9];
    mMatrix = mat4.translate(mMatrix, [-0.79, -0.55, 0]);
    mMatrix = mat4.scale(mMatrix, [0.07, 0.05, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    pushMatrix(matrixStack, mMatrix);
    color = [0, 0.51, 0, 0.9]
    mMatrix = mat4.translate(mMatrix, [-0.93, -0.53, 0]);
    mMatrix = mat4.scale(mMatrix, [0.13, 0.09, 1.0]);
    drawCircle(color, mMatrix);
    mMatrix = popMatrix(matrixStack);
}

// Draw roof (red rectangle + side triangles)
function drawHouseRoof() {
    pushMatrix(matrixStack, mMatrix);
    color = [1.0, 0.27, 0.0, 1];

    mMatrix = mat4.translate(mMatrix, [-0.55, -0.3, 0]);
    mMatrix = mat4.scale(mMatrix, [0.4, 0.2, 1.0]);
    drawSquare(color, mMatrix);
    mMatrix = popMatrix(matrixStack);

    let xOffsets = [-0.75, -0.35];
    for (let i = 0; i < xOffsets.length; i++) {
        pushMatrix(matrixStack, mMatrix);
        mMatrix = mat4.translate(mMatrix, [xOffsets[i], -0.3, 0]);
        mMatrix = mat4.rotate(mMatrix, 6.285, [0, 0, 1]);
        mMatrix = mat4.scale(mMatrix, [0.25, 0.2, 1.0]);
        drawTriangle(color, mMatrix);
        mMatrix = popMatrix(matrixStack);
    }
}

////////////////////////////////////////////////////////////////////////




function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // Pure black sky
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // stop the current loop of animation
    if (animation) {
        window.cancelAnimationFrame(animation);
    }

    function animate() {
        // Update the rotation angle
        rotationAngle += rotationSpeed;

        // Update star blinking time
        starBlinkTime += starBlinkSpeed;

        // Update translation based on direction for each boat independently
        translationX += (translationSpeed/2) * direction1;
        translationX1 += (translationSpeed/2) * direction2;

        // Reverse direction for first boat when it reaches the boundary
        if (translationX >= translationRange - 0.09) {
            direction1 = -1; // Move left
        }
        if (translationX <= -translationRange + 0.09) {
            direction1 = 1; // Move right
        }

        // Reverse direction for second boat when it reaches the boundary
        if (translationX1 >= translationRange - 0.09) {
            direction2 = -1; // Move left
        }
        if (translationX1 <= -translationRange + 0.09) {
            direction2 = 1; // Move right
        }


        drawSky();

        // applying animation to the sun
        drawMoon(rotationAngle);

        // Draw blinking stars
        drawStars();

        drawCloud();

   
        // draw the 3 mountains
        drawMountain(-0.6, 0.09, 1.2, 0.4, -0.555, 0.095);
        drawMountain(-0.076, 0.09, 1.8, 0.55, -0.014, 0.096);
        drawMountain(0.7, 0.12, 1.0, 0.3, -0.545, -0.005, true);

        drawGround();
        drawRoad();
        drawRiver();

        // draw the trees
        drawTrees(true, 0.35, 0, 0.85, 0.85)
        drawTrees();
        drawTrees(true, -0.15, 0, 0.8, 0.8)

        // applying back and forth motion to the boats
        drawBoat(translationX, translationX1, true); // Second boat (purple) - draw first
        drawBoat(translationX, translationX1); // First boat (red) - draw second (on top)

        // applying rotatory motion to the blades of the windmill
        drawFan(rotationAngle);
        drawFan(rotationAngle, true, -0.1, 0.1, 0.8); // Moved to the same side with higher Y position and smaller size

        // draw the bushes
        drawBush();
        drawBush(true, 0.8, 0, 1.02);
        drawBush(true, 1.49, -0.16, 1.6);
        drawBush(true, 2.25, 0.25, 1.3);

        drawHouse();
        drawCar();

        // Request the next animation frame
        animation = window.requestAnimationFrame(animate);
    }
    animate();
}

// This is the entry point from the html


function webGLStart() {
    var canvas = document.getElementById("scenery");
    initGL(canvas);
    shaderProgram = initShaders();

    //get locations of attributes declared in the vertex shader
    const aPositionLocation = gl.getAttribLocation(shaderProgram, "aPosition");

    uMMatrixLocation = gl.getUniformLocation(shaderProgram, "uMMatrix");

    //enable the attribute arrays
    gl.enableVertexAttribArray(aPositionLocation);

    uColorLoc = gl.getUniformLocation(shaderProgram, "color");

    initSquareBuffer();
    initTriangleBuffer();
    initCircleBuffer();
    initRayBuffer();
    initFanBladesBuffer();

    drawScene();
}


function changeView(m) {
    mode = m;
    drawScene();
}
