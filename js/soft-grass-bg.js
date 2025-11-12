// soft-grass-bg.js - Dynamic Soft Grass Background with WebGL Shaders
// 🌿 Implementa fondo de césped dinámico con ruido Perlin y parallax

class SoftGrassBG {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            Logger.error('Canvas not found:', canvasId);
            return;
        }
        
        this.gl = null;
        this.program = null;
        this.animationId = null;
        this.startTime = Date.now();
        
        // Configuración del césped
        this.config = {
            windSpeed: 0.5,           // Velocidad del viento
            windStrength: 0.015,      // Intensidad más sutil
            grassDensity: 12.0,       // Más denso para césped real
            colorVariation: 0.3,      // Variación de color
            parallaxStrength: 0.5,    // Parallax más sutil
            heightScale: 2.0,         // Escala del mapa de altura
            baseColor: [0.15, 0.45, 0.2], // Verde césped más realista
            tipColor: [0.25, 0.6, 0.3],   // Puntas más claras pero naturales
            shadowColor: [0.08, 0.25, 0.12] // Sombras más oscuras
        };
        
        this.uniforms = {};
        this.initWebGL();
        this.setupShaders();
        this.setupGeometry();
        this.resize();
        
        // Configurar redimensionado
        window.addEventListener('resize', () => this.resize());
        
        Logger.log('🌿 Soft Grass Background inicializado');
    }

    // 🎬 Iniciar después de que el juego esté listo
    startWhenReady() {
        // Añadir clase para mostrar gradualmente
        setTimeout(() => {
            this.canvas.classList.add('loaded');
            this.start();
        }, 500); // Esperar medio segundo
    }

    initWebGL() {
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            Logger.error('WebGL no soportado');
            return;
        }
        
        // Configuraciones básicas de WebGL
        this.gl.clearColor(0.15, 0.4, 0.2, 1.0); // Verde base de respaldo
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    setupShaders() {
        // 🎨 Vertex Shader - Básico para quad completo
        const vertexShaderSource = `
            attribute vec2 a_position;
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = (a_position + 1.0) * 0.5;
            }
        `;

        // 🌿 Fragment Shader - Césped dinámico con ruido Perlin
        const fragmentShaderSource = `
            precision mediump float;
            
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_windSpeed;
            uniform float u_windStrength;
            uniform float u_grassDensity;
            uniform float u_parallaxStrength;
            uniform float u_heightScale;
            uniform vec3 u_baseColor;
            uniform vec3 u_tipColor;
            uniform vec3 u_shadowColor;
            
            varying vec2 v_texCoord;
            
            // 🌊 Simplex Noise Functions (simplified)
            vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
            
            float snoise(vec2 v){
                const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy) );
                vec2 x0 = v -   i + dot(i, C.xx);
                vec2 i1;
                i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod(i, 289.0);
                vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                m = m*m ;
                m = m*m ;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }
            
            // 🌱 Generar patrón de césped (hebras verticales)
            float grassPattern(vec2 uv, float time) {
                // Crear hebras de césped verticales
                vec2 grassUV = uv * vec2(u_grassDensity * 2.0, u_grassDensity * 4.0);
                vec2 windOffset = vec2(
                    sin(time * u_windSpeed + grassUV.x) * u_windStrength * 0.5,
                    cos(time * u_windSpeed * 0.7 + grassUV.y) * u_windStrength * 0.3
                );
                
                vec2 deformedGrassUV = grassUV + windOffset;
                
                // Patrón de hebras (líneas verticales con ruido)
                float grassBlades = sin(deformedGrassUV.x * 3.14159) * 0.5 + 0.5;
                grassBlades *= smoothstep(0.3, 0.7, sin(deformedGrassUV.y * 0.5));
                
                // Añadir textura fina
                float detail = snoise(deformedGrassUV * 8.0) * 0.3;
                
                return grassBlades + detail;
            }
            
            // 🏔️ Mapa de altura procedural (más suave para césped)
            float heightMap(vec2 uv, float time) {
                vec2 windUV = uv + vec2(time * u_windSpeed * 0.1, 0.0);
                // Variación muy sutil para simular césped más alto/bajo
                float height = snoise(windUV * 2.0) * 0.2 + 0.7; // Mantener altura alta
                height += snoise(windUV * 6.0) * 0.1; // Detalles finos
                return clamp(height, 0.5, 1.0); // Césped nunca muy bajo
            }
            
            void main() {
                vec2 uv = v_texCoord;
                float time = u_time * 0.001;
                
                // 📏 Ajustar proporción
                vec2 aspectUV = uv;
                aspectUV.x *= u_resolution.x / u_resolution.y;
                
                // 🏔️ Calcular altura para parallax
                float height = heightMap(aspectUV, time);
                
                // 🌊 Aplicar deformación por viento con parallax
                vec2 windDeformation = vec2(
                    snoise(aspectUV * 4.0 + time * u_windSpeed) * u_windStrength,
                    snoise(aspectUV * 3.0 + time * u_windSpeed * 0.7) * u_windStrength * 0.5
                );
                
                // Parallax: las áreas más altas (blancas) se mueven más rápido
                vec2 parallaxOffset = windDeformation * height * u_parallaxStrength;
                vec2 deformedUV = aspectUV + parallaxOffset;
                
                // 🌱 Generar patrón de césped
                float grass = grassPattern(deformedUV, time);
                
                // 🎨 Colorear como césped real
                vec3 soilColor = vec3(0.08, 0.15, 0.05); // Tierra/base
                vec3 grassBase = u_baseColor;
                vec3 grassTip = u_tipColor;
                
                // Mezclar desde suelo hasta puntas de césped
                vec3 color = mix(soilColor, grassBase, height);
                color = mix(color, grassTip, smoothstep(0.2, 0.8, grass));
                
                // ✨ Variación natural de color
                float colorNoise = snoise(deformedUV * 4.0) * 0.08;
                color += colorNoise * vec3(0.1, 0.2, 0.1);
                
                // 🌟 Profundidad y sombras
                float shadow = smoothstep(0.4, 1.0, height);
                color *= mix(0.6, 1.0, shadow);
                
                // 💨 Brillo del viento en las puntas
                float windShine = smoothstep(0.6, 1.0, grass) * 
                                 smoothstep(0.2, 0.8, sin(time * 2.0 + deformedUV.x * 10.0));
                color += windShine * 0.15 * vec3(0.3, 0.6, 0.2);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `;

        // Compilar shaders
        const vertexShader = this.compileShader(vertexShaderSource, this.gl.VERTEX_SHADER);
        const fragmentShader = this.compileShader(fragmentShaderSource, this.gl.FRAGMENT_SHADER);
        
        if (!vertexShader || !fragmentShader) {
            Logger.error('Error compilando shaders');
            return;
        }

        // Crear programa
        this.program = this.gl.createProgram();
        this.gl.attachShader(this.program, vertexShader);
        this.gl.attachShader(this.program, fragmentShader);
        this.gl.linkProgram(this.program);

        if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
            Logger.error('Error linking program:', this.gl.getProgramInfoLog(this.program));
            return;
        }

        this.gl.useProgram(this.program);

        // Obtener ubicaciones de uniforms
        this.uniforms = {
            time: this.gl.getUniformLocation(this.program, 'u_time'),
            resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
            windSpeed: this.gl.getUniformLocation(this.program, 'u_windSpeed'),
            windStrength: this.gl.getUniformLocation(this.program, 'u_windStrength'),
            grassDensity: this.gl.getUniformLocation(this.program, 'u_grassDensity'),
            parallaxStrength: this.gl.getUniformLocation(this.program, 'u_parallaxStrength'),
            heightScale: this.gl.getUniformLocation(this.program, 'u_heightScale'),
            baseColor: this.gl.getUniformLocation(this.program, 'u_baseColor'),
            tipColor: this.gl.getUniformLocation(this.program, 'u_tipColor'),
            shadowColor: this.gl.getUniformLocation(this.program, 'u_shadowColor')
        };
    }

    compileShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            Logger.error('Error compilando shader:', this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            return null;
        }

        return shader;
    }

    setupGeometry() {
        // Crear quad que cubre toda la pantalla
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1
        ]);

        const buffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
        this.gl.enableVertexAttribArray(positionLocation);
        this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    render() {
        if (!this.gl || !this.program) return;

        const currentTime = Date.now() - this.startTime;
        
        // Limpiar
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Actualizar uniforms
        this.gl.uniform1f(this.uniforms.time, currentTime);
        this.gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
        this.gl.uniform1f(this.uniforms.windSpeed, this.config.windSpeed);
        this.gl.uniform1f(this.uniforms.windStrength, this.config.windStrength);
        this.gl.uniform1f(this.uniforms.grassDensity, this.config.grassDensity);
        this.gl.uniform1f(this.uniforms.parallaxStrength, this.config.parallaxStrength);
        this.gl.uniform1f(this.uniforms.heightScale, this.config.heightScale);
        this.gl.uniform3f(this.uniforms.baseColor, ...this.config.baseColor);
        this.gl.uniform3f(this.uniforms.tipColor, ...this.config.tipColor);
        this.gl.uniform3f(this.uniforms.shadowColor, ...this.config.shadowColor);

        // Renderizar
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        
        // Continuar animación
        this.animationId = requestAnimationFrame(() => this.render());
    }

    start() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.render();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // 🎛️ Métodos de configuración para tweaking dinámico
    setWindSpeed(speed) {
        this.config.windSpeed = speed;
    }

    setWindStrength(strength) {
        this.config.windStrength = strength;
    }

    setGrassColor(baseColor, tipColor = null, shadowColor = null) {
        this.config.baseColor = baseColor;
        if (tipColor) this.config.tipColor = tipColor;
        if (shadowColor) this.config.shadowColor = shadowColor;
    }

    // 📊 Información del sistema
    getInfo() {
        return {
            webglSupported: !!this.gl,
            shaderCompiled: !!this.program,
            isAnimating: !!this.animationId,
            config: this.config,
            canvasSize: {
                width: this.canvas.width,
                height: this.canvas.height
            }
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SoftGrassBG = SoftGrassBG;
}