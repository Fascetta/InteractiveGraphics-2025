function GetModelViewMatrix(translationX, translationY, translationZ, rotationX, rotationY) {
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

	return MatrixMult(trans, rotXY);
}

class MeshDrawer {
	constructor() {
		this.prog = InitShaderProgram(meshVS, meshFS);
		this.vertPosLoc = gl.getAttribLocation(this.prog, "aPosition");
		this.texCoordLoc = gl.getAttribLocation(this.prog, "aTexCoord");
		this.mvpLoc = gl.getUniformLocation(this.prog, "uModelViewProjection");
		this.swapYZLoc = gl.getUniformLocation(this.prog, "uSwapYZ");
		this.useTextureLoc = gl.getUniformLocation(this.prog, "uUseTexture");
		this.normalMatrixLoc = gl.getUniformLocation(this.prog, "uNormalMatrix");
		this.lightDirLoc = gl.getUniformLocation(this.prog, "uLightDirection");
		this.shininessLoc = gl.getUniformLocation(this.prog, "uShininess");
		this.vertBuffer = gl.createBuffer();
		this.texCoordBuffer = gl.createBuffer();
		this.normalBuffer = gl.createBuffer();
		this.texture = gl.createTexture();
	}

	setMesh(vertPos, texCoords, normals) {
		this.numTriangles = vertPos.length / 3;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	}

	swapYZ(swap) {
		gl.useProgram(this.prog);
		gl.uniform1i(this.swapYZLoc, swap ? 1 : 0);
	}

	draw(matrixMVP, matrixMV, matrixNormal) {
		gl.useProgram(this.prog);
		gl.uniformMatrix4fv(this.mvpLoc, false, matrixMVP);
		gl.uniformMatrix3fv(this.normalMatrixLoc, false, matrixNormal);

		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		gl.enableVertexAttribArray(this.vertPosLoc);
		gl.vertexAttribPointer(this.vertPosLoc, 3, gl.FLOAT, false, 0, 0);

		const normalLoc = gl.getAttribLocation(this.prog, "aNormal");
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.enableVertexAttribArray(normalLoc);
		gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);

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

	setLightDir(x, y, z) {
		gl.useProgram(this.prog);
		gl.uniform3f(this.lightDirLoc, x, y, z);
	}

	setShininess(shininess) {
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessLoc, shininess);
	}
}

const meshVS = `
precision mediump float;

attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

uniform mat3 uNormalMatrix;
uniform mat4 uModelViewProjection;
uniform bool uSwapYZ;

varying vec2 vTexCoord;
varying vec3 vNormal;

void main() {
	vec3 pos = aPosition;
	vec3 normal = aNormal;
	if (uSwapYZ) {
		pos = vec3(pos.x, pos.z, pos.y);
		normal = vec3(normal.x, normal.z, normal.y);
	}
	gl_Position = uModelViewProjection * vec4(pos, 1.0);
	vTexCoord = aTexCoord;
	vNormal = normalize(uNormalMatrix * normal);
}
`;

const meshFS = `
precision mediump float;

uniform bool uUseTexture;
uniform sampler2D uTexture;
uniform vec3 uLightDirection;
uniform float uShininess;

varying vec2 vTexCoord;
varying vec3 vNormal;

void main() {
	vec3 N = normalize(vNormal);
	vec3 L = normalize(uLightDirection);
	vec3 V = vec3(0.0, 0.0, 1.0);
	vec3 R = reflect(L, N);
	float diff = max(dot(N, L), 0.0);
	float spec = pow(max(dot(R, V), 0.0), uShininess);
	vec3 baseColor = vec3(1.0, 1.0, 1.0);
	if (uUseTexture) baseColor = texture2D(uTexture, vTexCoord).rgb;
	vec3 finalColor = baseColor * diff + vec3(spec);
	gl_FragColor = vec4(finalColor, 1.0);
}
`;
