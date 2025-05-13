function GetModelViewProjection(projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY) {
	var rotX = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0, -Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];

	var rotY = [
		Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
		0, 1, 0, 0,
		Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];

	var rotXY = MatrixMult(rotX, rotY);

	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];

	return MatrixMult(projectionMatrix, MatrixMult(trans, rotXY));
}

class MeshDrawer {
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.vertPosLoc = gl.getAttribLocation(this.prog, "aPosition");
		this.texCoordLoc = gl.getAttribLocation(this.prog, "aTexCoord");
		this.mvpLoc = gl.getUniformLocation(this.prog, "uModelViewProjection");
		this.swapYZLoc = gl.getUniformLocation(this.prog, "uSwapYZ");
		this.useTextureLoc = gl.getUniformLocation(this.prog, "uUseTexture");
		this.vertBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
		this.texture = gl.createTexture();
	}

	setMesh(vertPos, texCoords) {
		this.numTriangles = vertPos.length / 3;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
	}

	swapYZ(swap) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.swapYZLoc, swap ? 1 : 0);
	}

	draw(trans) {
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvpLoc, false, trans);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.enableVertexAttribArray(this.texCoordLoc);
		gl.vertexAttribPointer(this.texCoordLoc, 2, gl.FLOAT, false, 0, 0);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.drawArrays(gl.TRIANGLES, 0, this.numTriangles);
	}

	setTexture(img) {
		gl.useProgram(this.prog);
		gl.bindTexture(gl.TEXTURE_2D, this.texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
		gl.generateMipmap(gl.TEXTURE_2D);
		gl.uniform1i(this.useTextureLoc, 1);
	}

	showTexture(show) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.useTextureLoc, show ? 1 : 0);
	}
}

const meshVS = `
precision mediump float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
uniform mat4 uModelViewProjection;
uniform bool uSwapYZ;
varying vec2 vTexCoord;
void main() {
	vec3 pos = aPosition;
	if (uSwapYZ) pos = vec3(pos.x, pos.z, pos.y);
	gl_Position = uModelViewProjection * vec4(pos, 1.0);
	vTexCoord = aTexCoord;
}
`;

const meshFS = `
precision mediump float;
uniform bool uUseTexture;
uniform sampler2D uTexture;
varying vec2 vTexCoord;
void main() {
	gl_FragColor = uUseTexture ? texture2D(uTexture, vTexCoord) : vec4(1.0, gl_FragCoord.z * gl_FragCoord.z, 0.0, 1.0);
}
`;
