// upgrades.js - Sistema de mejoras con $ y ADN Puro

class Upgrade {
    constructor(id, name, description, baseCost, costType, maxLevel = Infinity) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.baseCost = baseCost;
        this.costType = costType; // 'money' o 'pureDNA'
        this.maxLevel = maxLevel;
        this.currentLevel = 0;
        this.costMultiplier = 1.5;
    }

    // Calcular el costo actual
    getCurrentCost() {
        if (this.currentLevel >= this.maxLevel) {
            return Infinity;
        }
        // Cálculo especial para expansión incremental de la cuadrícula
        if (this.id === 'expansion') {
            // Tamaño actual de la cuadrícula = base inicial + nivel actual
            const projectedGridSize = GAME_CONFIG.INITIAL_GRID_SIZE + this.currentLevel; // tamaño antes de comprar siguiente nivel
            // Fórmula: CostoBase * (GRID_SIZE / 5)
            return Math.floor(this.baseCost * (projectedGridSize / 5));
        }
        return Math.floor(this.baseCost * Math.pow(this.costMultiplier, this.currentLevel));
    }

    // Verificar si se puede comprar
    canPurchase(availableCurrency) {
        return availableCurrency >= this.getCurrentCost() && 
               this.currentLevel < this.maxLevel;
    }

    // Comprar mejora
    purchase() {
        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            return true;
        }
        return false;
    }

    // Obtener descripción con valores actuales
    getDescription() {
        return this.description.replace('{level}', this.currentLevel);
    }

    // Verificar si está al máximo nivel
    isMaxLevel() {
        return this.currentLevel >= this.maxLevel;
    }

    // Reset para nueva partida (mantener para $ upgrades)
    resetForNewGame() {
        // Las mejoras de $ se mantienen
    }

    // Reset para mutación
    resetForMutation() {
        if (this.costType === 'money') {
            this.currentLevel = 0;
        }
        // Las mejoras de ADN Puro se mantienen
    }
}

class UpgradeManager {
    constructor() {
        this.upgrades = new Map();
        this.initializeUpgrades();
    }

    // Inicializar todas las mejoras
    initializeUpgrades() {
        this.createBasicUpgrades();
        this.createExpansionUpgrades();
        this.createWallUpgrades();
        this.createPrestigeUpgrades();
    }

    // Crear mejoras básicas (Fase 1)
    createBasicUpgrades() {
        const speedUpgrade = new Upgrade(
            'speed',
            'Velocidad de Movimiento',
            'Aumenta la velocidad de la serpiente. Nivel {level}',
            10,
            'money',
            20
        );

        const multiplierUpgrade = new Upgrade(
            'multiplier',
            'Multiplicador de $',
            'Cada fruta otorga más $. x{level}',
            25,
            'money',
            10
        );

        const cultivoUpgrade = new Upgrade(
            'cultivo',
            'Cultivo Expandido',
            'Permite una fruta adicional simultánea (+1 por nivel).',
            150,
            'money',
            5
        );

        this.upgrades.set('speed', speedUpgrade);
        this.upgrades.set('multiplier', multiplierUpgrade);
        this.upgrades.set('cultivo', cultivoUpgrade);
    }

    // Crear mejoras de expansión (Fase 2)
    createExpansionUpgrades() {
        const expansionUpgrade = new Upgrade(
            'expansion',
            'Cápsula de Expansión',
            'Aumenta el tamaño de la cuadrícula (+1 por nivel).',
            100, // costo base (escala con tamaño actual)
            'money',
            10 // nivel técnico máximo para llegar a 15x15 si se habilita tras prestigio
        );

        const tilePcUpgrade = new Upgrade(
            'tile_pc',
            'Baldosas PC+',
            'Añade 1 baldosa PC_MULT colocable por nivel (total {level}).',
            250,
            'money',
            15
        );

        const tileSpeedUpgrade = new Upgrade(
            'tile_speed',
            'Baldosas Velocidad',
            'Añade 1 baldosa SPEED colocable por nivel (total {level}).',
            300,
            'money',
            15
        );

        this.upgrades.set('expansion', expansionUpgrade);
        this.upgrades.set('tile_pc', tilePcUpgrade);
        this.upgrades.set('tile_speed', tileSpeedUpgrade);
    }

    // Crear mejoras de muros (Fase 2)
    createWallUpgrades() {
        const portalWallUpgrade = new Upgrade(
            'portal_wall',
            'Portal Wall',
            'Añade un par de portales al inventario. Cantidad: {level}',
            200,
            'money',
            10
        );

        const repulsionWallUpgrade = new Upgrade(
            'repulsion_wall',
            'Muro de Repulsión',
            'Fuerza a la fruta a reaparecer lejos. Cantidad: {level}',
            300,
            'money',
            5
        );

        const boostWallUpgrade = new Upgrade(
            'boost_wall',
            'Muro de Impulso',
            'Otorga supervelocidad temporal. Cantidad: {level}',
            400,
            'money',
            5
        );

        this.upgrades.set('portal_wall', portalWallUpgrade);
        this.upgrades.set('repulsion_wall', repulsionWallUpgrade);
        this.upgrades.set('boost_wall', boostWallUpgrade);
    }

    // Crear mejoras de prestigio (Fase 3)
    createPrestigeUpgrades() {
        const startSpeedUpgrade = new Upgrade(
            'start_speed',
            'Velocidad Inicial Permanente',
            'Velocidad base permanente mejorada. Nivel {level}',
            1,
            'pureDNA',
            5
        );

        const startMultiplierUpgrade = new Upgrade(
            'start_multiplier',
            'Multiplicador Inicial Permanente',
            'Multiplicador base permanente. x{level}',
            2,
            'pureDNA',
            5
        );

        const fusionWallUpgrade = new Upgrade(
            'fusion_wall',
            'Muro de Fusión',
            'Muro especial que combina efectos. Cantidad: {level}',
            3,
            'pureDNA',
            3
        );

        // Cestas: cantidad y multiplicador (post-prestigio)
        const basketCountUpgrade = new Upgrade(
            'basket_count',
            'Cestas Adicionales',
            'Aumenta la cantidad de cestas disponibles. Cantidad total {level}',
            1,
            'pureDNA',
            10
        );
        const basketPowerUpgrade = new Upgrade(
            'basket_power',
            'Potenciador de Cesta',
            'Aumenta el multiplicador de cesta. x{level + 2}',
            2,
            'pureDNA',
            10
        );

        this.upgrades.set('start_speed', startSpeedUpgrade);
        this.upgrades.set('start_multiplier', startMultiplierUpgrade);
        this.upgrades.set('fusion_wall', fusionWallUpgrade);
        this.upgrades.set('basket_count', basketCountUpgrade);
        this.upgrades.set('basket_power', basketPowerUpgrade);
    }

    // Obtener mejora por ID
    getUpgrade(upgradeId) {
        return this.upgrades.get(upgradeId);
    }

    // Obtener todas las mejoras de un tipo
    getUpgradesByType(costType) {
        return Array.from(this.upgrades.values()).filter(upgrade => 
            upgrade.costType === costType
        );
    }

    // Comprar mejora
    purchaseUpgrade(upgradeId, stats, wallManager = null) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade) {
            Logger.warn(`Mejora ${upgradeId} no encontrada`);
            return false;
        }

        const cost = upgrade.getCurrentCost();
        let hasEnoughCurrency = false;

        // Verificar moneda disponible
        if (upgrade.costType === 'money') {
            hasEnoughCurrency = stats.money >= cost;
        } else if (upgrade.costType === 'pureDNA') {
            hasEnoughCurrency = stats.pureDNA >= cost;
        }

        if (!hasEnoughCurrency) {
            Logger.warn(`No hay suficiente ${upgrade.costType} para comprar ${upgradeId}`);
            return false;
        }

        // Comprar mejora
        if (!upgrade.purchase()) {
            Logger.warn(`No se pudo comprar ${upgradeId} (posiblemente al máximo nivel)`);
            return false;
        }

        // Deducir costo
        if (upgrade.costType === 'money') {
            stats.spendMoney(cost);
        } else if (upgrade.costType === 'pureDNA') {
            stats.spendPureDNA(cost);
        }

        // Aplicar efectos de la mejora
        this.applyUpgradeEffects(upgradeId, upgrade.currentLevel, wallManager);

        Logger.log(`Mejora ${upgradeId} comprada. Nivel actual: ${upgrade.currentLevel}`);
        return true;
    }

    // Aplicar efectos de mejora
    applyUpgradeEffects(upgradeId, level, wallManager = null) {
        switch (upgradeId) {
            case 'portal_wall':
                if (wallManager) {
                    wallManager.addToInventory(WALL_TYPES.PORTAL, 1);
                }
                break;
            case 'repulsion_wall':
                if (wallManager) {
                    wallManager.addToInventory(WALL_TYPES.REPULSION, 1);
                }
                break;
            case 'boost_wall':
                if (wallManager) {
                    wallManager.addToInventory(WALL_TYPES.BOOST, 1);
                }
                break;
            case 'tile_pc':
                // efecto manejado en game para incrementar inventario de baldosas
                break;
            case 'fusion_wall':
                // Implementar muro de fusión en el futuro
                break;
            case 'basket_count':
                // Asegurar inventario mínimo = base 1 + nivel permanente
                if (typeof game !== 'undefined' && game.stats) {
                    const minInv = 1 + level;
                    if ((game.stats.basketInventory || 0) < minInv) {
                        // Elevar a mínimo; no decrementar si ya tiene más por juego actual
                        game.stats.basketInventory = minInv;
                    }
                }
                break;
            case 'basket_power':
                if (typeof game !== 'undefined' && game.stats) {
                    // Base 2 + nivel actual (x3, x4, ...)
                    const minMult = 2 + level;
                    if ((game.stats.basketMultiplier || 0) < minMult) {
                        game.stats.basketMultiplier = minMult;
                    }
                }
                break;
        }
    }

    // Obtener velocidad actual de la serpiente
    getCurrentSpeed() {
        const speedUpgrade = this.getUpgrade('speed');
        const startSpeedUpgrade = this.getUpgrade('start_speed');
        
        const speedBonus = speedUpgrade ? speedUpgrade.currentLevel : 0;
        const startSpeedBonus = startSpeedUpgrade ? startSpeedUpgrade.currentLevel : 0;
        
        const totalSpeedMultiplier = 1 + (speedBonus * 0.2) + (startSpeedBonus * 0.1);
        return Math.max(GAME_CONFIG.MIN_SPEED, 
                       GAME_CONFIG.INITIAL_SPEED / totalSpeedMultiplier);
    }

    // Obtener multiplicador actual de $
    getCurrentMoneyMultiplier() {
        const multiplierUpgrade = this.getUpgrade('multiplier');
        const startMultiplierUpgrade = this.getUpgrade('start_multiplier');
        
        const multiplierLevel = multiplierUpgrade ? multiplierUpgrade.currentLevel : 0;
        const startMultiplierLevel = startMultiplierUpgrade ? startMultiplierUpgrade.currentLevel : 0;
        // $ base por fruta = 1 + niveles acumulados
        return 1 + multiplierLevel + startMultiplierLevel;
    }

    // Obtener tamaño actual de la cuadrícula
    getCurrentGridSize() {
        const expansionUpgrade = this.getUpgrade('expansion');
        const level = expansionUpgrade ? expansionUpgrade.currentLevel : 0;
        // Ahora cada nivel suma +1 celda al lado
        return GAME_CONFIG.INITIAL_GRID_SIZE + level;
    }

    // Verificar si una mejora está disponible para comprar
    isUpgradeAvailable(upgradeId, stats) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade) return false;

        // Verificar requisitos especiales
        switch (upgradeId) {
            case 'repulsion_wall':
                return this.getUpgrade('portal_wall').currentLevel >= 1;
            case 'boost_wall':
                return this.getUpgrade('portal_wall').currentLevel >= 1;
            case 'fusion_wall':
                return stats.pureDNA >= 1; // Disponible solo después de la primera mutación
        }

        return true;
    }

    // Obtener lista de mejoras disponibles para mostrar
    getAvailableUpgrades(costType, stats) {
        return this.getUpgradesByType(costType).filter(upgrade => 
            this.isUpgradeAvailable(upgrade.id, stats)
        );
    }

    // Reset para nueva partida
    resetForNewGame() {
        // Las mejoras de $ se mantienen
        this.upgrades.forEach(upgrade => upgrade.resetForNewGame());
    }

    // Reset para mutación
    resetForMutation() {
        this.upgrades.forEach(upgrade => upgrade.resetForMutation());
    }

    // Guardar mejoras
    save() {
        const upgradesData = {};
        this.upgrades.forEach((upgrade, id) => {
            upgradesData[id] = {
                currentLevel: upgrade.currentLevel
            };
        });
        StorageUtils.save('upgrades', upgradesData);
    }

    // Cargar mejoras
    load() {
        const upgradesData = StorageUtils.load('upgrades', {});
        Object.keys(upgradesData).forEach(id => {
            const upgrade = this.getUpgrade(id);
            if (upgrade) {
                upgrade.currentLevel = upgradesData[id].currentLevel || 0;
            }
        });
    }

    // Obtener información de debug
    getDebugInfo() {
        const info = {};
        this.upgrades.forEach((upgrade, id) => {
            info[id] = {
                level: upgrade.currentLevel,
                cost: upgrade.getCurrentCost(),
                maxLevel: upgrade.maxLevel,
                isMaxLevel: upgrade.isMaxLevel()
            };
        });
        return info;
    }
}

// Clase para manejar la UI de mejoras
class UpgradeUI {
    constructor(upgradeManager) {
        this.upgradeManager = upgradeManager;
        this.containers = {
            basic: document.getElementById('basic-upgrades'),
            expansion: document.getElementById('expansion-upgrades'),
            walls: document.getElementById('wall-upgrades'),
            prestige: document.getElementById('prestige-upgrades')
        };
    }

    // Actualizar toda la UI de mejoras
    updateUI(stats) {
        this.updateBasicUpgrades(stats);
        this.updateExpansionUpgrades(stats);
        this.updateWallUpgrades(stats);
        this.updatePrestigeUpgrades(stats);
        this.updatePrestigeVisibility(stats);

        // Si existe la carta de prestigio, actualizar su estado de compra
        if (this._prestigeBtn && typeof this._prestigeCost === 'number') {
            const canAfford = stats.money >= this._prestigeCost;
            if (canAfford) {
                this._prestigeBtn.classList.add('affordable');
                this._prestigeBtn.removeAttribute('disabled');
            } else {
                this._prestigeBtn.classList.remove('affordable');
                this._prestigeBtn.setAttribute('disabled', '');
            }
        }
    }

    // Actualizar mejoras básicas
    updateBasicUpgrades(stats) {
        const upgrades = ['speed', 'multiplier'];
        this.updateUpgradeContainer(this.containers.basic, upgrades, stats);
    }

    // Actualizar mejoras de expansión
    updateExpansionUpgrades(stats) {
        const all = ['expansion', 'cultivo']; // Ocultamos 'tile_pc', 'tile_speed' pero mantenemos la lógica
        const gridSizeNow = GAME_CONFIG.INITIAL_GRID_SIZE + (this.upgradeManager?.getUpgrade?.('expansion')?.currentLevel || 0);
        const cap = (typeof stats.getHasPrestiged === 'function' && stats.getHasPrestiged()) ? 15 : 10;

        // Cuando llegamos al cap (10x10 antes de prestigio, 15x15 después), reemplazamos la carta de expansión por Prestigio
        if (gridSizeNow >= cap) {
            const upgrades = all.filter(u => u !== 'expansion');
            // Renderizar el resto normalmente
            this.updateUpgradeContainer(this.containers.expansion, upgrades, stats);
            // Inyectar el item de Prestigio al inicio
            this.renderPrestigeShopItem(stats);
        } else {
            // Antes de 10x10, mostrar la expansión normal
            this.updateUpgradeContainer(this.containers.expansion, all, stats);
        }
    }

    // Renderizar un item de tienda especial para Prestigio dentro de la sección de Expansión
    renderPrestigeShopItem(stats) {
        if (!this.containers?.expansion) return;
        const container = this.containers.expansion;

        const cost = (GAME_CONFIG.ECONOMY && GAME_CONFIG.ECONOMY.PRESTIGE_PC_THRESHOLD) ? GAME_CONFIG.ECONOMY.PRESTIGE_PC_THRESHOLD : 10000;
        const canAfford = stats.money >= cost;

        // Eliminar una carta previa si ya existe para evitar duplicados
        const existing = container.querySelector('.upgrade-item.prestige-shop');
        if (existing) existing.remove();

        const upgradeDiv = document.createElement('div');
        upgradeDiv.className = 'upgrade-item prestige-shop';
        upgradeDiv.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">✨ Prestigio</span>
                <span class="upgrade-level">10x10</span>
            </div>
            <div class="upgrade-description">
                Reinicia la partida y obtén +1 ADN Puro. Disponible al alcanzar tablero 10x10.
            </div>
            <div class="upgrade-cost">
                <span class="cost-display">${FormatUtils.formatNumber(cost)} $</span>
                <button class="upgrade-btn ${canAfford ? 'affordable' : ''}" ${canAfford ? '' : 'disabled'}>
                    Prestigiar
                </button>
            </div>
        `;

        // Click en el botón -> delegamos al callback de compra con id 'prestige'
        const button = upgradeDiv.querySelector('.upgrade-btn');
        button.addEventListener('click', () => {
            this.onUpgradePurchase('prestige');
        });

        // Insertar al principio del contenedor
        container.prepend(upgradeDiv);

        // Guardar referencia para poder actualizar habilitado/estilo en cada updateUI
        this._prestigeBtn = button;
        this._prestigeCost = cost;
    }

    // Actualizar mejoras de muros
    updateWallUpgrades(stats) {
        const upgrades = []; // Ocultamos portal_wall, repulsion_wall, boost_wall pero mantenemos la lógica
        this.updateUpgradeContainer(this.containers.walls, upgrades, stats);
    }

    // Actualizar mejoras de prestigio
    updatePrestigeUpgrades(stats) {
        const upgrades = ['start_speed', 'start_multiplier', 'fusion_wall', 'basket_count', 'basket_power'];
        this.updateUpgradeContainer(this.containers.prestige, upgrades, stats);
    }

    // Actualizar visibilidad de la sección de prestigio
    updatePrestigeVisibility(stats) {
        const prestigeSection = document.querySelector('.prestige-section');
        if (prestigeSection) {
            // Mostrar si ya prestigió o si ya está en 10x10 para que vea las mejoras permanentes
            const expansionLevel = this.upgradeManager?.getUpgrade?.('expansion')?.currentLevel || 0;
            const gridSizeNow = GAME_CONFIG.INITIAL_GRID_SIZE + expansionLevel;
            const show = (typeof stats.getHasPrestiged === 'function' && stats.getHasPrestiged()) || gridSizeNow >= 10 || (stats.pureDNA > 0);
            prestigeSection.style.display = show ? 'block' : 'none';
        }
    }

    // Actualizar un contenedor específico de mejoras
    updateUpgradeContainer(container, upgradeIds, stats) {
        if (!container) return;

        container.innerHTML = '';
        
        upgradeIds.forEach(upgradeId => {
            const upgrade = this.upgradeManager.getUpgrade(upgradeId);
            if (!upgrade || !this.upgradeManager.isUpgradeAvailable(upgradeId, stats)) {
                return;
            }

            const upgradeElement = this.createUpgradeElement(upgrade, stats);
            container.appendChild(upgradeElement);
        });
    }

    // Crear elemento HTML para una mejora
    createUpgradeElement(upgrade, stats) {
        const upgradeDiv = document.createElement('div');
        upgradeDiv.className = 'upgrade-item';
        
        const cost = upgrade.getCurrentCost();
        const canAfford = upgrade.canPurchase(
            upgrade.costType === 'money' ? stats.money : stats.pureDNA
        );
        
        upgradeDiv.innerHTML = `
            <div class="upgrade-header">
                <span class="upgrade-name">${upgrade.name}</span>
                <span class="upgrade-level">Nv. ${upgrade.currentLevel}</span>
            </div>
            <div class="upgrade-description">${upgrade.getDescription()}</div>
            <div class="upgrade-cost">
                <span class="cost-display">
                    ${upgrade.isMaxLevel() ? 'MAX' : `${FormatUtils.formatNumber(cost)} ${upgrade.costType === 'money' ? '$' : 'ADN'}`}
                </span>
                <button class="upgrade-btn ${canAfford ? 'affordable' : ''}" 
                        ${canAfford && !upgrade.isMaxLevel() ? '' : 'disabled'}>
                    ${upgrade.isMaxLevel() ? 'MAX' : 'Comprar'}
                </button>
            </div>
        `;

        // Agregar event listener para compra
        const button = upgradeDiv.querySelector('.upgrade-btn');
        button.addEventListener('click', () => {
            this.onUpgradePurchase(upgrade.id);
        });

        return upgradeDiv;
    }

    // Manejar compra de mejora
    onUpgradePurchase(upgradeId) {
        // Esta función será sobrescrita por el juego principal
        Logger.log(`Intento de compra: ${upgradeId}`);
    }

    // Establecer callback para compra de mejoras
    setUpgradePurchaseCallback(callback) {
        this.onUpgradePurchase = callback;
    }
}

// Exportar si se usa en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Upgrade, UpgradeManager, UpgradeUI };
}