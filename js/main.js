// main.js - Punto de entrada del juego

// Variable global para el juego
let game;

// Inicializar el juego cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    Logger.log('DOM cargado, inicializando juego...');
    
    try {
        // Crear instancia del juego primero
        game = new IdleSnakeGame();
        
        // 🌿 Inicializar fondo de césped después del juego
        window.grassBackground = new SoftGrassBG('bg-canvas');
        window.grassBackground.startWhenReady();
        
        // Configurar controles adicionales
        setupAdditionalControls();
        
        // Configurar debugging en desarrollo
        if (isDevelopmentMode()) {
            setupDeveloperTools();
        }
        
        Logger.log('¡Idle Snake iniciado exitosamente!');
        
    } catch (error) {
        Logger.error('Error al inicializar el juego:', error);
        showErrorMessage('Error al cargar el juego. Por favor, recarga la página.');
    }
});

// Configurar controles adicionales
function setupAdditionalControls() {
    // Configurar botones de mejoras de muros
    setupWallUpgradeButtons();
    
    // Configurar modal de colocación de muros
    setupWallPlacementModal();
    
    // Configurar botón de mutación
    setupMutationButton();
    
    // Configurar atajos de teclado
    setupKeyboardShortcuts();
    
    Logger.log('Controles adicionales configurados');
}

// Configurar botones de mejoras de muros
function setupWallUpgradeButtons() {
    const wallContainer = document.getElementById('wall-upgrades');
    
    if (wallContainer) {
        wallContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('upgrade-btn') && !e.target.disabled) {
                const upgradeItem = e.target.closest('.upgrade-item');
                const upgradeName = upgradeItem.querySelector('.upgrade-name').textContent;
                
                // Verificar si es una mejora de muro
                const wallTypes = {
                    'Portal Wall': 'portal_wall',
                    'Muro de Repulsión': 'repulsion_wall',
                    'Muro de Impulso': 'boost_wall'
                };
                
                const upgradeId = wallTypes[upgradeName];
                if (upgradeId && game.purchaseUpgrade(upgradeId)) {
                    // Muro comprado, preguntar si quiere colocarlo
                    setTimeout(() => {
                        askForWallPlacement(getWallTypeFromUpgrade(upgradeId));
                    }, 100);
                }
            }
        });
    }
}

// Obtener tipo de muro desde ID de mejora
function getWallTypeFromUpgrade(upgradeId) {
    const mapping = {
        'portal_wall': WALL_TYPES.PORTAL,
        'repulsion_wall': WALL_TYPES.REPULSION,
        'boost_wall': WALL_TYPES.BOOST
    };
    return mapping[upgradeId];
}

// Preguntar si quiere colocar el muro recién comprado
function askForWallPlacement(wallType) {
    const wallNames = {
        [WALL_TYPES.PORTAL]: 'Portal',
        [WALL_TYPES.REPULSION]: 'Muro de Repulsión',
        [WALL_TYPES.BOOST]: 'Muro de Impulso'
    };
    
    const wallName = wallNames[wallType];
    const message = `¿Quieres colocar el ${wallName} ahora?`;
    
    if (confirm(message)) {
        game.startWallPlacement(wallType);
        showWallPlacementInstructions(wallType);
    }
}

// Mostrar instrucciones de colocación de muro
function showWallPlacementInstructions(wallType) {
    const modal = document.getElementById('wall-placement-modal');
    const instruction = document.getElementById('wall-instruction');
    
    const instructions = {
        [WALL_TYPES.PORTAL]: 'Haz clic en dos casillas vacías para colocar el par de portales.',
        [WALL_TYPES.REPULSION]: 'Haz clic en una casilla vacía para colocar el muro de repulsión.',
        [WALL_TYPES.BOOST]: 'Haz clic en una casilla vacía para colocar el muro de impulso.'
    };
    
    instruction.textContent = instructions[wallType];
    modal.style.display = 'flex';
}

// Configurar modal de colocación de muros
function setupWallPlacementModal() {
    const modal = document.getElementById('wall-placement-modal');
    const cancelBtn = document.getElementById('cancel-wall-btn');
    const confirmBtn = document.getElementById('confirm-wall-btn');
    
    // Botón cancelar
    cancelBtn.addEventListener('click', () => {
        game.wallManager.cancelPlacement();
        game.toggleEditMode(); // Salir del modo edición
        hideWallPlacementModal();
    });
    
    // Botón confirmar (para muros que requieren confirmación manual)
    confirmBtn.addEventListener('click', () => {
        // Implementar lógica de confirmación si es necesario
        hideWallPlacementModal();
    });
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            cancelBtn.click();
        }
    });
}

// Ocultar modal de colocación de muros
function hideWallPlacementModal() {
    const modal = document.getElementById('wall-placement-modal');
    modal.style.display = 'none';
}

// Configurar botón de mutación
function setupMutationButton() {
    // Crear botón de mutación dinámicamente cuando esté disponible
    const prestigeContainer = document.getElementById('prestige-upgrades');
    
    if (prestigeContainer) {
        // Observar cambios en la sección de prestigio
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    checkForMutationButton();
                }
            });
        });
        
        observer.observe(prestigeContainer.parentElement, {
            childList: true,
            subtree: true
        });
    }
}

// Verificar si necesita crear el botón de mutación
function checkForMutationButton() {
    const prestigeSection = document.querySelector('.prestige-section');
    
    if (prestigeSection && prestigeSection.style.display !== 'none') {
        let mutationBtn = document.getElementById('mutation-btn');
        
        if (!mutationBtn && game.stats.canMutate()) {
            mutationBtn = createMutationButton();
            prestigeSection.appendChild(mutationBtn);
        }
    }
}

// Crear botón de mutación
function createMutationButton() {
    const button = document.createElement('button');
    button.id = 'mutation-btn';
    button.className = 'upgrade-btn affordable';
    button.textContent = '🧬 MUTAR (Reiniciar con ADN Puro)';
    button.style.width = '100%';
    button.style.marginTop = '15px';
    button.style.padding = '15px';
    button.style.fontSize = '1.1rem';
    
    button.addEventListener('click', () => {
        showMutationConfirmation();
    });
    
    return button;
}

// Mostrar confirmación de mutación
function showMutationConfirmation() {
    const message = `¿Estás seguro de que quieres MUTAR?\n\n` +
                   `Esto reiniciará:\n` +
                   `- Todas las mejoras de $\n` +
                   `- Todos los muros colocados\n` +
                   `- El progreso actual\n\n` +
                   `Recibirás 1 Célula Mutante para mejoras permanentes.`;
    
    if (confirm(message)) {
        if (game.performMutation()) {
            showMutationSuccess();
        } else {
            alert('No se pudo realizar la mutación.');
        }
    }
}

// Mostrar éxito de mutación
function showMutationSuccess() {
    alert('¡Mutación exitosa! Has recibido 1 ADN Puro.\n\nPuedes usar el ADN Puro para comprar mejoras permanentes.');
}

// Configurar atajos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Solo procesar si no está escribiendo en un input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key.toLowerCase()) {
            case ' ':
            case 'p':
                e.preventDefault();
                game.togglePause();
                break;
            case 'e':
                e.preventDefault();
                if (!game.editModeBtn.disabled) {
                    game.toggleEditMode();
                }
                break;
            case 'escape':
                if (game.isEditMode) {
                    e.preventDefault();
                    game.toggleEditMode();
                }
                break;
            case '1':
                e.preventDefault();
                game.snakeSprites.setSnakeType(0); // Serpiente naranja
                break;
            case '2':
                e.preventDefault();
                game.snakeSprites.setSnakeType(1); // Serpiente verde
                break;
            case '3':
                e.preventDefault();
                game.snakeSprites.setSnakeType(2); // Serpiente azul
                break;
            case 's':
                e.preventDefault();
                game.snakeSprites.cycleSnakeType(); // Ciclar entre tipos
                break;
            case 'r':
                if (e.ctrlKey) { // Ctrl+R para recargar sprites
                    e.preventDefault();
                    if (game.snakeSprites && game.snakeSprites.spritesheetManager) {
                        game.snakeSprites.spritesheetManager.reloadSpritesheet();
                        Logger.log('🔄 Recargando sprites...');
                    }
                }
                break;
        }
    });
    
    Logger.log('Atajos de teclado configurados: Espacio/P (pausa), E (edición), Escape (salir edición), 1-3 (cambiar serpiente), S (ciclar serpiente), Ctrl+R (recargar sprites)');
}

// Configurar herramientas de desarrollador
function setupDeveloperTools() {
    // Exponer juego en consola
    window.game = game;
    window.debugGame = () => console.log(game.getDebugInfo());
    
    // Funciones de ayuda para debugging
    window.givePC = (amount) => {
        game.stats.addMoney(amount);
        game.updateUI();
    };
    
    window.giveMoney = (amount) => {
        game.stats.addMoney(amount);
        game.updateUI();
    };
    
    window.giveCM = (amount) => {
        game.stats.pureDNA += amount;
        game.updateUI();
    };
    
    // � Función para recargar el spritesheet (cuando cambies assets.png)
    window.reloadSprites = () => {
        if (game.snakeSprites && game.snakeSprites.spritesheetManager) {
            game.snakeSprites.spritesheetManager.reloadSpritesheet();
            console.log('🔄 Recargando spritesheet... Espera unos segundos.');
        } else {
            console.log('❌ Sistema de sprites no disponible');
        }
    };

    // �🗺️ Función para mostrar el mapa de posiciones del spritesheet
    window.showSpriteMap = () => {
        if (game.snakeSprites && game.snakeSprites.spritesheetManager) {
            const map = game.snakeSprites.spritesheetManager.getPositionMap();
            const info = game.snakeSprites.spritesheetManager.getInfo();
            
            console.log('🐍 MAPA DE POSICIONES DEL SPRITESHEET (32x32px por sprite)');
            console.log('=====================================================');
            console.log('📐 Dimensiones:', info.dimensions);
            console.log('');
            
            console.log('👤 CABEZAS (Heads):');
            Object.entries(map.heads).forEach(([direction, pos]) => {
                console.log(`  ${direction.padEnd(8)}: Índice ${pos.index.toString().padStart(2)} -> X: ${pos.pixelX.toString().padStart(3)}px`);
            });
            
            console.log('\n🟫 CUERPOS (Bodies):');
            Object.entries(map.bodies).forEach(([type, pos]) => {
                console.log(`  ${type.padEnd(12)}: Índice ${pos.index.toString().padStart(2)} -> X: ${pos.pixelX.toString().padStart(3)}px`);
            });
            
            console.log('\n🔚 COLAS (Tails):');
            Object.entries(map.tails).forEach(([direction, pos]) => {
                console.log(`  ${direction.padEnd(8)}: Índice ${pos.index.toString().padStart(2)} -> X: ${pos.pixelX.toString().padStart(3)}px`);
            });
            
            console.log('\n🌈 SERPIENTES (Y positions):');
            console.log('  Naranja: Y: 0px   (Fila 0)');
            console.log('  Verde:   Y: 32px  (Fila 1)');
            console.log('  Azul:    Y: 64px  (Fila 2)');
            
            console.log('\n🎬 ANIMACIONES FUTURAS:');
            const animInfo = game.snakeSprites.spritesheetManager.getAnimationInfo();
            console.log('  Estado:', animInfo.available ? 'Activas' : 'Preparadas');
            Object.entries(animInfo.futureFrames).forEach(([name, config]) => {
                console.log(`  ${name}: Índice ${config.start} + ${config.frames} frames`);
            });
            
            return map;
        } else {
            console.log('❌ Spritesheet no disponible');
        }
    };
    
    // 🌿 Funciones de debugging para el fondo de césped
    window.grassInfo = () => {
        if (window.grassBackground) {
            console.log('🌿 INFORMACIÓN DEL FONDO DE CÉSPED');
            console.log('================================');
            const info = window.grassBackground.getInfo();
            console.log('WebGL soportado:', info.webglSupported);
            console.log('Shader compilado:', info.shaderCompiled);
            console.log('Animando:', info.isAnimating);
            console.log('Tamaño canvas:', info.canvasSize);
            console.log('Configuración:', info.config);
            return info;
        } else {
            console.log('❌ Fondo de césped no disponible');
        }
    };
    
    window.setGrassWind = (speed, strength) => {
        if (window.grassBackground) {
            window.grassBackground.setWindSpeed(speed || 0.5);
            if (strength !== undefined) {
                window.grassBackground.setWindStrength(strength);
            }
            console.log(`🌊 Viento ajustado: velocidad=${speed}, fuerza=${strength}`);
        }
    };
    
    window.setGrassColors = (base, tip, shadow) => {
        if (window.grassBackground) {
            window.grassBackground.setGrassColor(base, tip, shadow);
            console.log('🎨 Colores de césped actualizados');
        }
    };

    // 🎨 Ajustar color base de la serpiente (HSL)
    window.setSnakeColorHSL = (h, s, l) => {
        if (typeof PROC_VISUAL_CONFIG !== 'undefined') {
            PROC_VISUAL_CONFIG.SNAKE_BASE_H = h;
            PROC_VISUAL_CONFIG.SNAKE_BASE_S = s;
            PROC_VISUAL_CONFIG.SNAKE_BASE_L = l;
            console.log('🐍 Color base HSL actualizado:', h, s, l);
        }
    };

    window.giveDNA = (amount) => {
        game.stats.addPureDNA(amount);
        game.updateUI();
    };
    
    window.forceMaxLength = () => {
        game.stats.maxLength = 100;
        game.updateUI();
    };

    // Comandos adicionales para testing
    window.forcePrestige = () => {
        if (!game.stats.getHasPrestiged()) {
            game.stats.hasPrestiged = true;
            console.log("Prestigio forzado activado");
        }
        game.updateUI();
    };

    window.spawnGolden = () => {
        if (game.fruits && game.fruits.length > 0) {
            game.fruits[0].setType('golden');
            console.log("Manzana Dorada spawneada");
        }
    };

    window.testPrestige = () => {
        givePC(50000); // Dar suficiente dinero
        for(let i = 0; i < 5; i++) { // Comprar 5 expansiones para llegar a 10x10
            game.handleUpgradePurchase('expansion');
        }
        console.log(`Grid size: ${game.gridSize}, Money: ${game.stats.money}, Can prestige: ${game.prestigeReady}`);
    };

    window.help = () => {
        console.log(`
🎮 COMANDOS DE DEBUG DISPONIBLES:
💰 givePC(amount) o giveMoney(amount) - Dar dinero ($)
🧬 giveCM(amount) o giveDNA(amount) - Dar ADN Puro  
📏 forceMaxLength() - Forzar longitud máxima a 100
🏆 forcePrestige() - Activar estado de prestigio
🍎 spawnGolden() - Convertir primera fruta en dorada
🧪 testPrestige() - Preparar condiciones para prestigio
🔄 hardReset() - Reset nuclear (limpia TODO sin confirmación)
🔍 checkState() - Mostrar estado actual de upgrades
❓ help() - Mostrar esta ayuda
        `);
    };

    window.checkState = () => {
        if (typeof game !== 'undefined' && game) {
            console.log("🔍 ESTADO ACTUAL DEL JUEGO:");
            console.log("Grid Size:", game.gridSize);
            console.log("Money:", game.stats?.money || 0);
            console.log("DNA:", game.stats?.pureDNA || 0);
            console.log("Has Prestiged:", game.stats?.getHasPrestiged?.() || false);
            
            if (game.upgradeManager && game.upgradeManager.upgrades) {
                console.log("📦 UPGRADES ACTIVOS:");
                Object.entries(game.upgradeManager.upgrades).forEach(([key, upgrade]) => {
                    if (upgrade.currentLevel > 0) {
                        console.log(`  ${key}: nivel ${upgrade.currentLevel}`);
                    }
                });
            }
            
            console.log("💾 LOCALSTORAGE:");
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                console.log(`  ${key}: ${localStorage.getItem(key).substring(0, 100)}...`);
            }
        } else {
            console.log("❌ Objeto game no encontrado");
        }
    };

    window.hardReset = () => {
        // Reset nuclear sin confirmación - para debugging
        console.log("🚀 Iniciando HARD RESET...");
        
        // Paso 1: Limpiar TODOS los storages
        localStorage.clear();
        sessionStorage.clear();
        
        // Paso 2: Forzar reset completo del objeto game si existe
        if (typeof game !== 'undefined' && game) {
            try {
                // Reset stats
                if (game.stats) {
                    game.stats.hasPrestiged = false;
                    game.stats.setHasPrestiged(false);
                    game.stats.pureDNA = 0;
                    game.stats.money = 0;
                    game.stats.maxLength = 3;
                }
                
                // Reset upgrade manager
                if (game.upgradeManager) {
                    game.upgradeManager.upgrades = {};
                }
                
                // Reset grid size
                if (game.gridSize) {
                    game.gridSize = 5;
                }
                
                console.log("💀 Estado del juego destruido");
            } catch (e) {
                console.log("❌ Error limpiando estado:", e);
            }
        }
        
        // Paso 3: Limpiar el objeto game completamente
        if (typeof window.game !== 'undefined') {
            delete window.game;
        }
        
        console.log("🚀 HARD RESET completado - recargando página...");
        setTimeout(() => {
            window.location.href = window.location.href.split('?')[0] + '?hardreset=' + Date.now();
        }, 150);
    };
    
    window.toggleGodMode = () => {
        // Implementar modo dios si es necesario
        Logger.log('Modo desarrollador disponible en consola');
    };
    
    Logger.log('Herramientas de desarrollador disponibles. Usa debugGame() para ver el estado.');
}

// Verificar si está en modo desarrollo
function isDevelopmentMode() {
    return location.hostname === 'localhost' || 
           location.hostname === '127.0.0.1' ||
           location.protocol === 'file:';
}

// Mostrar mensaje de error
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 10000;
        font-family: Arial, sans-serif;
    `;
    errorDiv.innerHTML = `
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="
            background: white;
            color: red;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
        ">Recargar Página</button>
    `;
    document.body.appendChild(errorDiv);
}

// Manejar errores no capturados
window.addEventListener('error', (e) => {
    Logger.error('Error no capturado:', e.error);
    showErrorMessage('Ha ocurrido un error inesperado. Por favor, recarga la página.');
});

// Manejar promesas rechazadas
window.addEventListener('unhandledrejection', (e) => {
    Logger.error('Promesa rechazada:', e.reason);
    e.preventDefault();
});

// Función para reiniciar el juego completamente
function restartGame() {
    if (confirm('¿Estás seguro de que quieres reiniciar completamente el juego? Se perderán todos los datos guardados.')) {
        // Limpiar localStorage completamente
        StorageUtils.clear();
        
        // Limpiar también sessionStorage por si acaso
        try {
            sessionStorage.clear();
        } catch (e) {
            console.error('Error limpiando sessionStorage:', e);
        }
        
        // Limpiar variables globales del juego si existen
        if (typeof game !== 'undefined' && game) {
            // Forzar reset completo del estado del juego antes de recargar
            try {
                if (game.stats) {
                    game.stats.hasPrestiged = false;
                    game.stats.setHasPrestiged(false);
                    game.stats.pureDNA = 0;
                    game.stats.money = 0;
                }
            } catch (e) {
                console.log('Estado del juego limpiado');
            }
        }
        
        // Forzar recarga completa sin cache
        window.location.href = window.location.href.split('?')[0] + '?reset=' + Date.now();
    }
}

// Exponer función de reinicio globalmente
window.restartGame = restartGame;

Logger.log('Idle Snake v1.0 - Archivos principales cargados');