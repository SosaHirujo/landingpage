/**
 * SOSA HIRUJO & ASOCS., S.R.L. — 3D BANK VAULT & SCROLLYTELLING ENGINE
 * Features: Procedural 3D Bank Safe with Exploded View, Interactive Orbit,
 * Dynamic PBR Materials, Linkage Mechanisms, and UI Telemetry.
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. STATE & DOM ELEMENTS
    // =========================================================================
    const canvas = document.getElementById('vaultCanvas');
    const scrollyWrapper = document.getElementById('experiencia-3d');
    const hudArmorState = document.getElementById('hudArmorState');
    const hudExplodePercent = document.getElementById('hudExplodePercent');
    const hudBoltsState = document.getElementById('hudBoltsState');
    const scrollCue = document.getElementById('scrollCue');
    
    // Controls
    const btnModeScroll = document.getElementById('btnModeScroll');
    const btnModeInspect = document.getElementById('btnModeInspect');
    const btnResetView = document.getElementById('btnResetView');
    const explodeSlider = document.getElementById('explodeSlider');
    const sliderValue = document.getElementById('sliderValue');
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const contactForm = document.getElementById('contactForm');
    const yearSpan = document.getElementById('year');
    const toast = document.getElementById('toastNotification');

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Engine Mode: 'scroll' | 'inspect'
    let currentMode = 'scroll';
    let manualExplodeFactor = 0;
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    // Mouse Dragging in Inspect Mode
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let inspectRotation = { x: 0.15, y: -0.45 };
    let targetInspectRotation = { x: 0.15, y: -0.45 };

    // =========================================================================
    // 2. THREE.JS INITIALIZATION
    // =========================================================================
    if (!window.THREE || !canvas) {
        console.warn('Three.js or Canvas not loaded');
        return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 100);
    // Start camera looking slightly left so vault sits on the RIGHT side of screen
    camera.position.set(-1.8, 0.3, 7.8);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // =========================================================================
    // 3. LIGHTING & ENVIRONMENT
    // =========================================================================
    // Professional warm ambient — off-white, not too dark
    const ambientLight = new THREE.AmbientLight(0xd0ddf0, 2.2);
    scene.add(ambientLight);

    // Key Light: warm top-left banking spotlight
    const keyLight = new THREE.DirectionalLight(0xfff8e8, 3.5);
    keyLight.position.set(-4, 7, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Rim Light: cool blue-white from right for depth
    const rimLight = new THREE.DirectionalLight(0xb8d4ff, 1.8);
    rimLight.position.set(6, 1, -3);
    scene.add(rimLight);

    // Fill: soft warm from below to illuminate vault base
    const fillLight = new THREE.DirectionalLight(0xffeedd, 1.0);
    fillLight.position.set(0, -4, 5);
    scene.add(fillLight);

    // Internal glow when vault opens — warm gold
    const vaultInternalLight = new THREE.PointLight(0xffcf70, 1.6, 5);
    vaultInternalLight.position.set(0, 0, 0);
    scene.add(vaultInternalLight);

    // =========================================================================
    // 4. PBR MATERIALS
    // =========================================================================
    // ─── PROFESSIONAL BANKING SAFE MATERIALS ───
    // Deep navy steel body — matches brand colors
    const matChassis = new THREE.MeshStandardMaterial({
        color: 0x0c2461,  // brand navy
        roughness: 0.22,
        metalness: 0.92
    });

    const matChassisBezel = new THREE.MeshStandardMaterial({
        color: 0x142e70,  // slightly lighter navy
        roughness: 0.15,
        metalness: 0.95
    });

    const matDoorBase = new THREE.MeshStandardMaterial({
        color: 0x1a3580,
        roughness: 0.2,
        metalness: 0.92
    });

    // Polished chrome
    const matChrome = new THREE.MeshStandardMaterial({
        color: 0xf0f4ff,
        roughness: 0.04,
        metalness: 1.0
    });

    // Brand gold — C9A227
    const matGold = new THREE.MeshStandardMaterial({
        color: 0xc9a227,
        roughness: 0.15,
        metalness: 0.96
    });

    const matBrassGears = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.28,
        metalness: 0.9
    });

    const matDarkInterior = new THREE.MeshStandardMaterial({
        color: 0x0a1a40,
        roughness: 0.45,
        metalness: 0.75
    });

    const matCyanGlow = new THREE.MeshStandardMaterial({
        color: 0x4db6ff,
        emissive: 0x4db6ff,
        emissiveIntensity: 0.6,
        roughness: 0.1
    });

    const matEmeraldGlow = new THREE.MeshStandardMaterial({
        color: 0x38ef7d,
        emissive: 0x38ef7d,
        emissiveIntensity: 0.7,
        roughness: 0.1
    });

    const matLines = new THREE.LineBasicMaterial({
        color: 0xc9a227,
        transparent: true,
        opacity: 0.3
    });

    // =========================================================================
    // 5. PROCEDURAL 3D BANK VAULT MODELING
    // =========================================================================
    const vaultRoot = new THREE.Group();
    scene.add(vaultRoot);

    // -------------------------------------------------------------
    // A. CHASSIS / CAJA FUERTE PRINCIPAL
    // -------------------------------------------------------------
    const chassisGroup = new THREE.Group();
    vaultRoot.add(chassisGroup);

    // Outer Box (Armored Walls)
    const vaultWidth = 3.2;
    const vaultHeight = 3.6;
    const vaultDepth = 2.4;
    const wallThick = 0.25;

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(vaultWidth, vaultHeight, wallThick),
        matChassis
    );
    backWall.position.set(0, 0, -vaultDepth / 2 + wallThick / 2);
    chassisGroup.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThick, vaultHeight, vaultDepth - wallThick),
        matChassis
    );
    leftWall.position.set(-vaultWidth / 2 + wallThick / 2, 0, 0);
    chassisGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThick, vaultHeight, vaultDepth - wallThick),
        matChassis
    );
    rightWall.position.set(vaultWidth / 2 - wallThick / 2, 0, 0);
    chassisGroup.add(rightWall);

    // Top wall
    const topWall = new THREE.Mesh(
        new THREE.BoxGeometry(vaultWidth, wallThick, vaultDepth - wallThick),
        matChassis
    );
    topWall.position.set(0, vaultHeight / 2 - wallThick / 2, 0);
    chassisGroup.add(topWall);

    // Bottom wall
    const bottomWall = new THREE.Mesh(
        new THREE.BoxGeometry(vaultWidth, wallThick, vaultDepth - wallThick),
        matChassis
    );
    bottomWall.position.set(0, -vaultHeight / 2 + wallThick / 2, 0);
    chassisGroup.add(bottomWall);

    // Front Bezel Frame (Bisel de entrada con remaches)
    const bezelGeometry = new THREE.BoxGeometry(vaultWidth + 0.15, vaultHeight + 0.15, 0.15);
    const frontBezel = new THREE.Mesh(bezelGeometry, matChassisBezel);
    frontBezel.position.set(0, 0, vaultDepth / 2 - 0.05);
    chassisGroup.add(frontBezel);

    // Heavy Industrial Rivets around Bezel
    const rivetGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12);
    const rivetCountX = 7;
    const rivetCountY = 8;
    for (let i = 0; i < rivetCountX; i++) {
        const x = -vaultWidth / 2 + (vaultWidth / (rivetCountX - 1)) * i;
        const rivetTop = new THREE.Mesh(rivetGeo, matChrome);
        rivetTop.rotation.x = Math.PI / 2;
        rivetTop.position.set(x, vaultHeight / 2 + 0.02, vaultDepth / 2 + 0.04);
        chassisGroup.add(rivetTop);

        const rivetBottom = new THREE.Mesh(rivetGeo, matChrome);
        rivetBottom.rotation.x = Math.PI / 2;
        rivetBottom.position.set(x, -vaultHeight / 2 - 0.02, vaultDepth / 2 + 0.04);
        chassisGroup.add(rivetBottom);
    }
    for (let j = 0; j < rivetCountY; j++) {
        const y = -vaultHeight / 2 + (vaultHeight / (rivetCountY - 1)) * j;
        const rivetLeft = new THREE.Mesh(rivetGeo, matChrome);
        rivetLeft.rotation.x = Math.PI / 2;
        rivetLeft.position.set(-vaultWidth / 2 - 0.02, y, vaultDepth / 2 + 0.04);
        chassisGroup.add(rivetLeft);

        const rivetRight = new THREE.Mesh(rivetGeo, matChrome);
        rivetRight.rotation.x = Math.PI / 2;
        rivetRight.position.set(vaultWidth / 2 + 0.02, y, vaultDepth / 2 + 0.04);
        chassisGroup.add(rivetRight);
    }

    // Vault Base Pedestal
    const pedestal = new THREE.Mesh(
        new THREE.BoxGeometry(vaultWidth + 0.4, 0.25, vaultDepth + 0.2),
        matChassis
    );
    pedestal.position.set(0, -vaultHeight / 2 - 0.125, 0);
    chassisGroup.add(pedestal);

    // -------------------------------------------------------------
    // B. INTERIOR SAFE DEPOSIT BOXES (Cajetines Bancarios & Lingotes)
    // -------------------------------------------------------------
    const depositBoxesGroup = new THREE.Group();
    depositBoxesGroup.position.set(0, 0, -0.2);
    chassisGroup.add(depositBoxesGroup);

    const rows = 4;
    const cols = 3;
    const boxW = 0.78;
    const boxH = 0.65;
    const boxD = 1.4;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const bx = (c - (cols - 1) / 2) * (boxW + 0.06);
            const by = (r - (rows - 1) / 2) * (boxH + 0.06);

            const depositBox = new THREE.Mesh(
                new THREE.BoxGeometry(boxW, boxH, boxD),
                matDarkInterior
            );
            depositBox.position.set(bx, by, 0);

            // Front plate of deposit box (Brushed Steel / Gold trim)
            const boxFace = new THREE.Mesh(
                new THREE.BoxGeometry(boxW - 0.02, boxH - 0.02, 0.04),
                (r === 1 && c === 1) ? matGold : matChassisBezel
            );
            boxFace.position.set(0, 0, boxD / 2 + 0.02);
            depositBox.add(boxFace);

            // Dual Keyholes for Bank Custody
            const keyhole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), matChrome);
            keyhole1.rotation.x = Math.PI / 2;
            keyhole1.position.set(-0.15, 0, boxD / 2 + 0.05);
            depositBox.add(keyhole1);

            const keyhole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.02, 8), matChrome);
            keyhole2.rotation.x = Math.PI / 2;
            keyhole2.position.set(0.15, 0, boxD / 2 + 0.05);
            depositBox.add(keyhole2);

            // Chrome Handle
            const handle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.03, 0.04), matChrome);
            handle.position.set(0, -0.12, boxD / 2 + 0.05);
            depositBox.add(handle);

            depositBoxesGroup.add(depositBox);
        }
    }

    // Gold Bullion Stacks inside central drawer
    const goldStackGroup = new THREE.Group();
    goldStackGroup.position.set(0, -0.4, 0.4);
    for (let g = 0; g < 6; g++) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.6), matGold);
        bar.position.set((g % 2 === 0 ? -0.15 : 0.15), Math.floor(g / 2) * 0.09, 0);
        goldStackGroup.add(bar);
    }
    depositBoxesGroup.add(goldStackGroup);

    // -------------------------------------------------------------
    // C. HINGES & DOOR PIVOT (Bisagras de Gran Tonelaje)
    // -------------------------------------------------------------
    const hingePivotX = -vaultWidth / 2 + 0.1;
    const hingePivotZ = vaultDepth / 2;

    const doorPivot = new THREE.Group();
    doorPivot.position.set(hingePivotX, 0, hingePivotZ);
    vaultRoot.add(doorPivot);

    // Heavy Hinge Cylinders
    const hingeTop = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 20), matChrome);
    hingeTop.position.set(0, 1.1, 0);
    doorPivot.add(hingeTop);

    const hingeBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 20), matChrome);
    hingeBottom.position.set(0, -1.1, 0);
    doorPivot.add(hingeBottom);

    // -------------------------------------------------------------
    // D. DOOR MAIN GROUP (La Puerta Acorazada)
    // -------------------------------------------------------------
    const doorMainGroup = new THREE.Group();
    // Offset door so its hinge aligns with doorPivot origin
    const doorOffsetX = vaultWidth / 2 - 0.2;
    doorMainGroup.position.set(doorOffsetX, 0, 0);
    doorPivot.add(doorMainGroup);

    const doorW = vaultWidth - 0.35;
    const doorH = vaultHeight - 0.35;
    const doorD = 0.28;

    // Base Armored Slab
    const doorSlab = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, doorD), matDoorBase);
    doorMainGroup.add(doorSlab);

    // Circular Bank Vault Outer Bezel Inlay (Relieve circular característico de bancos)
    const vaultDoorBezelRing = new THREE.Mesh(
        new THREE.RingGeometry(0.75, 0.95, 36),
        matChrome
    );
    vaultDoorBezelRing.position.set(0, 0, doorD / 2 + 0.01);
    doorMainGroup.add(vaultDoorBezelRing);

    // -------------------------------------------------------------
    // E. LOCKING BOLTS (Pasadores Cilíndricos de Acero 32mm)
    // -------------------------------------------------------------
    const lockingBoltsGroup = new THREE.Group();
    doorMainGroup.add(lockingBoltsGroup);

    const bolts = [];
    const boltGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.45, 16);

    // 4 Right Edge Bolts
    for (let b = 0; b < 4; b++) {
        const by = -1.0 + b * 0.65;
        const bolt = new THREE.Mesh(boltGeo, matChrome);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(doorW / 2 - 0.05, by, 0);
        bolt.userData = { initialX: doorW / 2 - 0.05, extendedX: doorW / 2 + 0.18 };
        lockingBoltsGroup.add(bolt);
        bolts.push(bolt);
    }

    // 2 Top Bolts
    for (let b = 0; b < 2; b++) {
        const bx = -0.4 + b * 0.8;
        const bolt = new THREE.Mesh(boltGeo, matChrome);
        bolt.position.set(bx, doorH / 2 - 0.05, 0);
        bolt.userData = { initialY: doorH / 2 - 0.05, extendedY: doorH / 2 + 0.18 };
        lockingBoltsGroup.add(bolt);
        bolts.push(bolt);
    }

    // 2 Bottom Bolts
    for (let b = 0; b < 2; b++) {
        const bx = -0.4 + b * 0.8;
        const bolt = new THREE.Mesh(boltGeo, matChrome);
        bolt.position.set(bx, -doorH / 2 + 0.05, 0);
        bolt.userData = { initialY: -doorH / 2 + 0.05, extendedY: -doorH / 2 - 0.18 };
        lockingBoltsGroup.add(bolt);
        bolts.push(bolt);
    }

    // -------------------------------------------------------------
    // F. CERRAJERÍA INTERNA & ENGRANAJES (Exploded Mechanism Layer)
    // -------------------------------------------------------------
    const mechanismGroup = new THREE.Group();
    doorMainGroup.add(mechanismGroup);

    // Anti-drill Manganese Armor Plate
    const antiDrillPlate = new THREE.Mesh(
        new THREE.BoxGeometry(doorW - 0.2, doorH - 0.2, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x4a5d78, roughness: 0.4, metalness: 0.9 })
    );
    antiDrillPlate.position.set(0, 0, 0.1);
    mechanismGroup.add(antiDrillPlate);

    // Central Gear Transmission System
    const gears = [];
    
    // Main Sun Gear (Central)
    const mainGearGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.05, 24);
    const mainGear = new THREE.Mesh(mainGearGeo, matBrassGears);
    mainGear.rotation.x = Math.PI / 2;
    mainGear.position.set(0, 0, 0.18);
    mechanismGroup.add(mainGear);
    gears.push(mainGear);

    // 3 Planetary Interlocking Gears
    for (let g = 0; g < 3; g++) {
        const angle = (g / 3) * Math.PI * 2;
        const gx = Math.cos(angle) * 0.58;
        const gy = Math.sin(angle) * 0.58;
        const subGear = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 16), matGold);
        subGear.rotation.x = Math.PI / 2;
        subGear.position.set(gx, gy, 0.18);
        mechanismGroup.add(subGear);
        gears.push(subGear);
    }

    // Mechanical Linkage Arms (Varillaje de acero que conecta los pasadores)
    const linkageArm1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.02), matChrome);
    linkageArm1.position.set(0.4, 0.4, 0.2);
    linkageArm1.rotation.z = Math.PI / 4;
    mechanismGroup.add(linkageArm1);

    const linkageArm2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.02), matChrome);
    linkageArm2.position.set(0.4, -0.4, 0.2);
    linkageArm2.rotation.z = -Math.PI / 4;
    mechanismGroup.add(linkageArm2);

    // Relocker Glass & Solenoid Emergency Trigger Box
    const relockerBox = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.08), matCyanGlow);
    relockerBox.position.set(-0.6, 0.5, 0.18);
    mechanismGroup.add(relockerBox);

    // -------------------------------------------------------------
    // G. FRONT EXTERIOR FACEPLATE & CONTROLS (Frontal Despiezado)
    // -------------------------------------------------------------
    const faceplateGroup = new THREE.Group();
    doorMainGroup.add(faceplateGroup);

    // Front Cover Shield
    const frontShield = new THREE.Mesh(
        new THREE.BoxGeometry(doorW + 0.04, doorH + 0.04, 0.06),
        matChassisBezel
    );
    frontShield.position.set(0, 0, 0.25);
    faceplateGroup.add(frontShield);

    // Brand Nameplate "SOSA HIRUJO"
    const nameplate = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, 0.22, 0.02),
        matGold
    );
    nameplate.position.set(0, 1.15, 0.29);
    faceplateGroup.add(nameplate);

    // Digital LED Biometric Display
    const keypadDisplay = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 0.65, 0.04),
        matDarkInterior
    );
    keypadDisplay.position.set(0.7, 0.4, 0.3);
    faceplateGroup.add(keypadDisplay);

    const keypadLED = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.12, 0.02),
        matEmeraldGlow
    );
    keypadLED.position.set(0.7, 0.62, 0.32);
    faceplateGroup.add(keypadLED);

    // Rotary Combination Dial
    const comboDialGroup = new THREE.Group();
    comboDialGroup.position.set(-0.65, 0, 0.3);
    faceplateGroup.add(comboDialGroup);

    const dialRing = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.08, 32), matGold);
    dialRing.rotation.x = Math.PI / 2;
    comboDialGroup.add(dialRing);

    const dialCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 24), matChrome);
    dialCenter.rotation.x = Math.PI / 2;
    comboDialGroup.add(dialCenter);

    // Timón / Volante de 4 Puntas Cromado de Banco (Turning Wheel)
    const turnWheelGroup = new THREE.Group();
    turnWheelGroup.position.set(0.1, -0.15, 0.32);
    faceplateGroup.add(turnWheelGroup);

    // Central Wheel Hub
    const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.14, 24), matChrome);
    wheelHub.rotation.x = Math.PI / 2;
    turnWheelGroup.add(wheelHub);

    const wheelHubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 24), matGold);
    wheelHubCap.rotation.x = Math.PI / 2;
    turnWheelGroup.add(wheelHubCap);

    // 4 Chrome Spokes & Grips
    for (let s = 0; s < 4; s++) {
        const spokeAngle = (s / 4) * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 16), matChrome);
        spoke.position.set(Math.cos(spokeAngle) * 0.35, Math.sin(spokeAngle) * 0.35, 0);
        spoke.rotation.z = spokeAngle + Math.PI / 2;
        turnWheelGroup.add(spoke);

        // Heavy handle ball at tip
        const grip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), matGold);
        grip.position.set(Math.cos(spokeAngle) * 0.7, Math.sin(spokeAngle) * 0.7, 0);
        turnWheelGroup.add(grip);
    }

    // =========================================================================
    // 6. ANIMATION & SCROLL-DRIVEN EXPLODED MATH
    // =========================================================================
    function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function calculateScrollProgress() {
        if (!scrollyWrapper) return 0;
        const rect = scrollyWrapper.getBoundingClientRect();
        const totalHeight = scrollyWrapper.clientHeight - window.innerHeight;
        if (totalHeight <= 0) return 0;
        const scrolled = -rect.top;
        return clamp(scrolled / totalHeight, 0, 1);
    }

    // Update Telemetry on HUD
    function updateHUD(p, explodeAmount) {
        if (!hudArmorState || !hudExplodePercent || !hudBoltsState) return;

        const percentText = Math.round(explodeAmount * 100) + '% DESPIECE';
        hudExplodePercent.textContent = percentText;

        if (p < 0.15) {
            hudArmorState.textContent = 'GRADO BANCARIO IV (ARMADO)';
            hudBoltsState.textContent = 'PASADORES BLOQUEADOS (32mm)';
            hudBoltsState.className = 'hud-val hud-val--cyan';
        } else if (p < 0.40) {
            hudArmorState.textContent = 'DESBLOQUEO AUTORIZADO';
            hudBoltsState.textContent = 'PASADORES RETRAÍDOS';
            hudBoltsState.className = 'hud-val hud-val--gold';
        } else if (p < 0.75) {
            hudArmorState.textContent = 'CERRAJERÍA DESCOMPUESTA';
            hudBoltsState.textContent = 'ENGRANAJES EN EXPANSIÓN';
            hudBoltsState.className = 'hud-val hud-val--gold';
        } else {
            hudArmorState.textContent = 'CÁMARA ACORAZADA ABIERTA';
            hudBoltsState.textContent = 'CAJETINES DESLIZADOS';
            hudBoltsState.className = 'hud-val hud-val--cyan';
        }

        // Hide scroll cue when user has scrolled past hero
        if (scrollCue) {
            scrollCue.style.opacity = p > 0.08 ? '0' : '1';
        }
    }

    // Main Render & Physics Loop
    let clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // 1. Determine target progression based on mode
        let progress = 0;
        let explodeAmount = 0;

        if (currentMode === 'scroll') {
            targetScrollProgress = calculateScrollProgress();
            currentScrollProgress = lerp(currentScrollProgress, targetScrollProgress, 0.08);
            progress = currentScrollProgress;
            explodeAmount = progress;
        } else {
            // Inspect mode: controlled via slider and mouse
            explodeAmount = manualExplodeFactor;
            progress = manualExplodeFactor;
        }

        updateHUD(progress, explodeAmount);

        // 2. Rotate mechanical gears and turning wheel smoothly
        const wheelSpin = progress < 0.25 ? (progress / 0.25) * Math.PI * 1.5 : Math.PI * 1.5;
        turnWheelGroup.rotation.z = wheelSpin;
        comboDialGroup.rotation.z = -wheelSpin * 2.5;

        // Animate internal clockwork gears
        mainGear.rotation.z = wheelSpin;
        gears.forEach((gear, idx) => {
            if (idx > 0) gear.rotation.z = -wheelSpin * 1.8;
        });

        // 3. Bolts retraction & explosion
        const boltRetract = clamp(progress * 5, 0, 1); // Retracts quickly at start
        bolts.forEach((bolt) => {
            if (bolt.userData.initialX !== undefined) {
                // Right bolts
                const baseRetracted = bolt.userData.initialX;
                const baseExtended = bolt.userData.extendedX;
                // At progress 0: extended; when opening: retract; in full exploded view: expand outwards
                if (progress < 0.3) {
                    bolt.position.x = lerp(baseExtended, baseRetracted, boltRetract);
                } else {
                    const explodeOffset = (progress - 0.3) * 0.9;
                    bolt.position.x = baseRetracted + explodeOffset;
                }
            } else if (bolt.userData.initialY !== undefined) {
                // Top & bottom bolts
                const baseRetracted = bolt.userData.initialY;
                const baseExtended = bolt.userData.extendedY;
                if (progress < 0.3) {
                    bolt.position.y = lerp(baseExtended, baseRetracted, boltRetract);
                } else {
                    const dir = baseExtended > 0 ? 1 : -1;
                    const explodeOffset = (progress - 0.3) * 0.8 * dir;
                    bolt.position.y = baseRetracted + explodeOffset;
                }
            }
        });

        // 4. Door Swing on Hinges (Stage 1: 0.12 -> 0.40)
        let doorAngle = 0;
        if (progress > 0.12) {
            const doorOpenT = clamp((progress - 0.12) / 0.28, 0, 1);
            // Smooth ease in-out
            doorAngle = -doorOpenT * (Math.PI * 0.42); // ~75 degrees open
        }
        doorPivot.rotation.y = doorAngle;

        // 5. Exploded View Offsets (Stage 2 & 3: 0.35 -> 1.0)
        let explodeFactor = 0;
        if (progress > 0.30) {
            explodeFactor = clamp((progress - 0.30) / 0.70, 0, 1);
        }

        // Explode Faceplate forward
        faceplateGroup.position.z = explodeFactor * 1.4;
        faceplateGroup.position.x = explodeFactor * 0.35;

        // Explode Wheel & Dial even further forward
        turnWheelGroup.position.z = 0.32 + explodeFactor * 0.6;
        comboDialGroup.position.z = 0.3 + explodeFactor * 0.5;

        // Explode Cerrajería & Gears in mid-air
        mechanismGroup.position.z = explodeFactor * 0.75;
        mechanismGroup.position.y = explodeFactor * 0.2;

        // Explode Deposit Boxes out of the Vault Chassis
        const boxesSlideT = clamp((progress - 0.60) / 0.40, 0, 1);
        depositBoxesGroup.position.z = -0.2 + boxesSlideT * 1.35;
        depositBoxesGroup.position.x = boxesSlideT * 0.2;

        // 6. Camera Position & Dynamic Orbiting
        if (currentMode === 'scroll') {
            // Camera stays slightly left so vault occupies right side of screen
            // As scroll advances the camera gently orbits for cinematic effect
            const baseCamX = -1.8 + Math.sin(progress * Math.PI * 0.6) * 0.9;
            const baseCamY = 0.3 + Math.cos(progress * Math.PI * 0.5) * 0.35;
            const baseCamZ = 7.8 - progress * 0.9;

            camera.position.x = lerp(camera.position.x, baseCamX, 0.055);
            camera.position.y = lerp(camera.position.y, baseCamY, 0.055);
            camera.position.z = lerp(camera.position.z, baseCamZ, 0.055);

            // Vault sits on right, slight permanent left tilt + gentle float
            vaultRoot.rotation.y = Math.sin(elapsedTime * 0.35) * 0.03 - 0.18;
            vaultRoot.rotation.x = Math.cos(elapsedTime * 0.28) * 0.015 + 0.05;
            vaultRoot.position.x = 1.6; // offset right
            vaultRoot.position.y = Math.sin(elapsedTime * 0.55) * 0.04;
        } else {
            // Inspect mode: Orbit freely
            inspectRotation.x = lerp(inspectRotation.x, targetInspectRotation.x, 0.1);
            inspectRotation.y = lerp(inspectRotation.y, targetInspectRotation.y, 0.1);

            vaultRoot.rotation.x = inspectRotation.x;
            vaultRoot.rotation.y = inspectRotation.y;
            vaultRoot.position.set(0, 0, 0); // center when in inspect mode

            camera.position.set(0, 0, 7.4);
        }

        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
    }

    animate();

    // =========================================================================
    // 7. USER INTERACTION & 3D CONTROLS
    // =========================================================================

    // Mode Switching
    if (btnModeScroll && btnModeInspect) {
        btnModeScroll.addEventListener('click', () => {
            currentMode = 'scroll';
            btnModeScroll.classList.add('active');
            btnModeInspect.classList.remove('active');
            showToast('Modo Historia activado (Desplázate por la página)');
        });

        btnModeInspect.addEventListener('click', () => {
            currentMode = 'inspect';
            btnModeInspect.classList.add('active');
            btnModeScroll.classList.remove('active');
            manualExplodeFactor = currentScrollProgress > 0 ? currentScrollProgress : 0.5;
            if (explodeSlider) {
                explodeSlider.value = Math.round(manualExplodeFactor * 100);
                if (sliderValue) sliderValue.textContent = explodeSlider.value + '%';
            }
            showToast('Modo Inspección 360°: Arrastra con el ratón y usa el slider');
        });
    }

    // Explode Slider
    if (explodeSlider) {
        explodeSlider.addEventListener('input', (e) => {
            currentMode = 'inspect';
            btnModeInspect.classList.add('active');
            btnModeScroll.classList.remove('active');
            manualExplodeFactor = e.target.value / 100;
            if (sliderValue) sliderValue.textContent = e.target.value + '%';
        });
    }

    // Reset View Button
    if (btnResetView) {
        btnResetView.addEventListener('click', () => {
            targetInspectRotation = { x: 0.15, y: -0.45 };
            manualExplodeFactor = 0;
            if (explodeSlider) {
                explodeSlider.value = 0;
                if (sliderValue) sliderValue.textContent = '0%';
            }
            showToast('Vista 3D restablecida');
        });
    }

    // Mouse Dragging for 360° Orbit (Canvas or Window during inspect mode)
    window.addEventListener('mousedown', (e) => {
        if (currentMode === 'inspect') {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (isDragging && currentMode === 'inspect') {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            targetInspectRotation.y += deltaX * 0.008;
            targetInspectRotation.x += deltaY * 0.008;

            // Clamp vertical rotation
            targetInspectRotation.x = clamp(targetInspectRotation.x, -Math.PI / 3, Math.PI / 3);

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    window.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // Touch Support for Mobile Dragging
    window.addEventListener('touchstart', (e) => {
        if (currentMode === 'inspect' && e.touches.length === 1) {
            isDragging = true;
            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (isDragging && currentMode === 'inspect' && e.touches.length === 1) {
            const deltaX = e.touches[0].clientX - previousMousePosition.x;
            const deltaY = e.touches[0].clientY - previousMousePosition.y;

            targetInspectRotation.y += deltaX * 0.008;
            targetInspectRotation.x += deltaY * 0.008;
            targetInspectRotation.x = clamp(targetInspectRotation.x, -Math.PI / 3, Math.PI / 3);

            previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });

    // Window Resize Handling
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // =========================================================================
    // 8. MOBILE NAV & FORM HANDLERS
    // =========================================================================

    // Mobile Navbar Toggle
    if (navToggle && mainNav) {
        navToggle.addEventListener('click', () => {
            const isOpen = mainNav.classList.toggle('is-open');
            navToggle.setAttribute('aria-expanded', String(isOpen));
        });

        mainNav.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                mainNav.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Toast Notification Helper
    function showToast(message, duration = 4000) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // Contact & Quote Form Submission
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = contactForm.querySelector('#name').value.trim();
            const phone = contactForm.querySelector('#phone').value.trim();
            const service = contactForm.querySelector('#service').value;
            const location = contactForm.querySelector('#location').value.trim();
            const message = contactForm.querySelector('#message').value.trim();

            if (!name || !phone || !service || !location || !message) {
                showToast('⚠️ Por favor completa los campos requeridos (*)');
                return;
            }

            // Create formatted WhatsApp link option
            const serviceLabels = {
                'venta': 'Venta de Caja Fuerte / Bóveda',
                'apertura': 'Apertura Técnica de Emergencia',
                'reparacion': 'Reparación de Cerrajería / Mecanismo',
                'mantenimiento': 'Mantenimiento Preventivo Periódico',
                'cajetines': 'Cajetines de Seguridad / Esclusas',
                'otro': 'Otro Requerimiento'
            };

            const waText = encodeURIComponent(
                `*Solicitud de Cotización Web - Sosa Hirujo*\n` +
                `👤 *Nombre / Empresa:* ${name}\n` +
                `📞 *Teléfono:* ${phone}\n` +
                `🛠️ *Servicio:* ${serviceLabels[service] || service}\n` +
                `📍 *Ubicación:* ${location}\n` +
                `📝 *Detalle:* ${message}`
            );

            showToast('✅ ¡Solicitud recibida! Te contactaremos a la brevedad posible.');
            contactForm.reset();

            // Ask if user wants direct WhatsApp dispatch
            setTimeout(() => {
                if (confirm('¿Deseas enviar también estos detalles directamente a nuestro WhatsApp oficial?')) {
                    window.open(`https://wa.me/18295964439?text=${waText}`, '_blank');
                }
            }, 800);
        });
    }

})();
