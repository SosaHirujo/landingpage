/**
 * SOSA HIRUJO & ASOCS., S.R.L. — 3D BANK VAULT SCROLLYTELLING
 * Production: Scroll-only. No interactive controls.
 * The vault opens as the user scrolls, then fades out to reveal content.
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. STATE & DOM
    // =========================================================================
    const canvas = document.getElementById('vaultCanvas');
    const scrollyWrapper = document.getElementById('hero');
    const scrollCue = document.getElementById('scrollCue');
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const contactForm = document.getElementById('contactForm');
    const yearSpan = document.getElementById('year');
    const toast = document.getElementById('toastNotification');

    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Scroll state
    let targetScrollProgress = 0;
    let currentScrollProgress = 0;

    // =========================================================================
    // 2. THREE.JS INITIALIZATION
    // =========================================================================
    if (!window.THREE || !canvas) {
        console.warn('Three.js or Canvas not loaded');
        return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 100);
    // Centered view — vault in the middle, imposing
    camera.position.set(0, 0.2, 8.2);

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // =========================================================================
    // 3. LIGHTING
    // =========================================================================
    // Professional warm ambient
    const ambientLight = new THREE.AmbientLight(0xd0ddf0, 2.0);
    scene.add(ambientLight);

    // Key Light: warm top-front
    const keyLight = new THREE.DirectionalLight(0xfff8e8, 3.2);
    keyLight.position.set(-3, 7, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Rim Light: cool blue-white from right
    const rimLight = new THREE.DirectionalLight(0xb8d4ff, 1.6);
    rimLight.position.set(5, 1, -3);
    scene.add(rimLight);

    // Fill: soft warm from below
    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.9);
    fillLight.position.set(0, -4, 5);
    scene.add(fillLight);

    // Internal glow when vault opens — warm gold
    const vaultInternalLight = new THREE.PointLight(0xffcf70, 0, 5);
    vaultInternalLight.position.set(0, 0, 0);
    scene.add(vaultInternalLight);

    // =========================================================================
    // 4. PBR MATERIALS — Professional Navy/Gold/Chrome
    // =========================================================================
    const matChassis = new THREE.MeshStandardMaterial({
        color: 0x0c2461,
        roughness: 0.22,
        metalness: 0.92
    });

    const matChassisBezel = new THREE.MeshStandardMaterial({
        color: 0x142e70,
        roughness: 0.15,
        metalness: 0.95
    });

    const matDoorBase = new THREE.MeshStandardMaterial({
        color: 0x1a3580,
        roughness: 0.2,
        metalness: 0.92
    });

    const matChrome = new THREE.MeshStandardMaterial({
        color: 0xf0f4ff,
        roughness: 0.04,
        metalness: 1.0
    });

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
        emissiveIntensity: 0.5,
        roughness: 0.1
    });

    const matEmeraldGlow = new THREE.MeshStandardMaterial({
        color: 0x38ef7d,
        emissive: 0x38ef7d,
        emissiveIntensity: 0.6,
        roughness: 0.1
    });

    const matLines = new THREE.LineBasicMaterial({
        color: 0xc9a227,
        transparent: true,
        opacity: 0.25
    });

    // =========================================================================
    // 5. VAULT GEOMETRY — Procedural 3D Bank Safe
    // =========================================================================
    const vaultRoot = new THREE.Group();
    scene.add(vaultRoot);

    // --- CHASSIS (Main Body) ---
    const chassisWidth = 3.2;
    const chassisHeight = 3.0;
    const chassisDepth = 2.4;

    const chassisGroup = new THREE.Group();
    vaultRoot.add(chassisGroup);

    // Back + Sides + Top + Bottom as separate panels
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(chassisWidth, chassisHeight, 0.18), matChassis);
    backWall.position.set(0, 0, -chassisDepth / 2);
    chassisGroup.add(backWall);

    // Right Wall
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, chassisHeight, chassisDepth), matChassis);
    rightWall.position.set(chassisWidth / 2, 0, 0);
    chassisGroup.add(rightWall);

    // Left Wall (hinge side)
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.18, chassisHeight, chassisDepth), matChassis);
    leftWall.position.set(-chassisWidth / 2, 0, 0);
    chassisGroup.add(leftWall);

    // Top
    const topWall = new THREE.Mesh(new THREE.BoxGeometry(chassisWidth, 0.18, chassisDepth), matChassis);
    topWall.position.set(0, chassisHeight / 2, 0);
    chassisGroup.add(topWall);

    // Bottom
    const bottomWall = new THREE.Mesh(new THREE.BoxGeometry(chassisWidth, 0.18, chassisDepth), matChassis);
    bottomWall.position.set(0, -chassisHeight / 2, 0);
    chassisGroup.add(bottomWall);

    // Bezel Frame around the front
    const bezelH = new THREE.Mesh(new THREE.BoxGeometry(chassisWidth + 0.35, 0.16, 0.3), matChassisBezel);
    const bezelH2 = bezelH.clone();
    bezelH.position.set(0, chassisHeight / 2 + 0.08, chassisDepth / 2 - 0.05);
    bezelH2.position.set(0, -chassisHeight / 2 - 0.08, chassisDepth / 2 - 0.05);
    chassisGroup.add(bezelH, bezelH2);

    const bezelV = new THREE.Mesh(new THREE.BoxGeometry(0.16, chassisHeight + 0.5, 0.3), matChassisBezel);
    const bezelV2 = bezelV.clone();
    bezelV.position.set(chassisWidth / 2 + 0.08, 0, chassisDepth / 2 - 0.05);
    bezelV2.position.set(-chassisWidth / 2 - 0.08, 0, chassisDepth / 2 - 0.05);
    chassisGroup.add(bezelV, bezelV2);

    // Interior cavity (dark recessed void)
    const interior = new THREE.Mesh(
        new THREE.BoxGeometry(chassisWidth - 0.5, chassisHeight - 0.5, chassisDepth - 0.5),
        matDarkInterior
    );
    interior.position.set(0, 0, -0.15);
    chassisGroup.add(interior);

    // --- DOOR on a HINGE PIVOT ---
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-chassisWidth / 2 + 0.1, 0, chassisDepth / 2);
    vaultRoot.add(doorPivot);

    const doorGroup = new THREE.Group();
    doorGroup.position.set(chassisWidth / 2 - 0.1, 0, 0);
    doorPivot.add(doorGroup);

    // Door Slab
    const doorSlab = new THREE.Mesh(
        new THREE.BoxGeometry(chassisWidth - 0.2, chassisHeight - 0.2, 0.35),
        matDoorBase
    );
    doorGroup.add(doorSlab);

    // Door inner panel
    const doorInner = new THREE.Mesh(
        new THREE.BoxGeometry(chassisWidth - 0.6, chassisHeight - 0.6, 0.06),
        matChassisBezel
    );
    doorInner.position.z = -0.2;
    doorGroup.add(doorInner);

    // --- BOLTS ---
    const bolts = [];

    // Right side bolts (4x)
    for (let i = 0; i < 4; i++) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.52, 12), matChrome);
        bolt.rotation.z = Math.PI / 2;
        const yPos = -0.9 + i * 0.6;
        const retractedX = chassisWidth / 2 - 0.45;
        const extendedX = chassisWidth / 2 - 0.12;
        bolt.position.set(extendedX, yPos, 0.08);
        bolt.userData = { initialX: retractedX, extendedX: extendedX };
        doorGroup.add(bolt);
        bolts.push(bolt);
    }

    // Top and bottom bolts (2x each)
    for (let side of [-1, 1]) {
        for (let i = 0; i < 2; i++) {
            const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 12), matChrome);
            const xPos = -0.4 + i * 0.8;
            const retractedY = side * (chassisHeight / 2 - 0.45);
            const extendedY = side * (chassisHeight / 2 - 0.12);
            bolt.position.set(xPos, extendedY, 0.08);
            bolt.userData = { initialY: retractedY, extendedY: extendedY };
            doorGroup.add(bolt);
            bolts.push(bolt);
        }
    }

    // --- HINGE ASSEMBLIES ---
    for (let i = 0; i < 3; i++) {
        const hingeArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.18), matChrome);
        hingeArm.position.set(-chassisWidth / 2 + 0.35, -0.85 + i * 0.85, 0.16);
        doorGroup.add(hingeArm);

        const hingePin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.28, 12), matGold);
        hingePin.position.copy(hingeArm.position);
        doorGroup.add(hingePin);
    }

    // --- FACEPLATE & MECHANISM GROUP ---
    const faceplateGroup = new THREE.Group();
    doorGroup.add(faceplateGroup);

    // Door faceplate (raised center panel)
    const faceplate = new THREE.Mesh(
        new THREE.BoxGeometry(chassisWidth - 0.8, chassisHeight - 0.7, 0.08),
        matChassisBezel
    );
    faceplate.position.z = 0.22;
    faceplateGroup.add(faceplate);

    // --- INTERNAL GEAR MECHANISM ---
    const mechanismGroup = new THREE.Group();
    mechanismGroup.position.set(0, 0, -0.08);
    doorGroup.add(mechanismGroup);

    const gears = [];

    // Main Drive Gear
    const mainGear = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 24), matBrassGears);
    mainGear.rotation.x = Math.PI / 2;
    mainGear.position.set(-0.3, 0.35, 0.05);
    mechanismGroup.add(mainGear);
    gears.push(mainGear);

    // Smaller linked gears
    const gearPositions = [
        { x: 0.15, y: 0.55, r: 0.22 },
        { x: -0.65, y: -0.15, r: 0.25 },
        { x: 0.4, y: -0.1, r: 0.18 }
    ];

    gearPositions.forEach(gp => {
        const gear = new THREE.Mesh(new THREE.CylinderGeometry(gp.r, gp.r, 0.07, 20), matBrassGears);
        gear.rotation.x = Math.PI / 2;
        gear.position.set(gp.x, gp.y, 0.05);
        mechanismGroup.add(gear);
        gears.push(gear);
    });

    // Linkage bars (connecting mechanism)
    const linkageEndpoints = [
        [[-0.3, 0.35], [0.15, 0.55]],
        [[-0.3, 0.35], [-0.65, -0.15]],
        [[-0.65, -0.15], [0.4, -0.1]]
    ];

    linkageEndpoints.forEach(pair => {
        const geo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(pair[0][0], pair[0][1], 0.1),
            new THREE.Vector3(pair[1][0], pair[1][1], 0.1)
        ]);
        const line = new THREE.Line(geo, matLines);
        mechanismGroup.add(line);
    });

    // --- DEPOSIT BOXES (inside vault) ---
    const depositBoxesGroup = new THREE.Group();
    depositBoxesGroup.position.set(0, 0, -0.2);
    chassisGroup.add(depositBoxesGroup);

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 3; col++) {
            const box = new THREE.Mesh(
                new THREE.BoxGeometry(0.72, 0.5, 1.5),
                matChassisBezel
            );
            box.position.set(-0.85 + col * 0.88, -0.9 + row * 0.62, 0);
            depositBoxesGroup.add(box);

            // Keyhole
            const keyhole = new THREE.Mesh(
                new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8),
                matGold
            );
            keyhole.rotation.x = Math.PI / 2;
            keyhole.position.set(box.position.x, box.position.y, 0.77);
            depositBoxesGroup.add(keyhole);

            // Label number
            const labelPlate = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.1, 0.02),
                matGold
            );
            labelPlate.position.set(box.position.x + 0.18, box.position.y + 0.15, 0.77);
            depositBoxesGroup.add(labelPlate);
        }
    }

    // --- FACEPLATE DETAILS ---
    // Keypad display
    const keypadDisplay = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.52, 0.04),
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

    // Timón / Volante de 4 Puntas
    const turnWheelGroup = new THREE.Group();
    turnWheelGroup.position.set(0.1, -0.15, 0.32);
    faceplateGroup.add(turnWheelGroup);

    const wheelHub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.14, 24), matChrome);
    wheelHub.rotation.x = Math.PI / 2;
    turnWheelGroup.add(wheelHub);

    const wheelHubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.16, 24), matGold);
    wheelHubCap.rotation.x = Math.PI / 2;
    turnWheelGroup.add(wheelHubCap);

    for (let s = 0; s < 4; s++) {
        const spokeAngle = (s / 4) * Math.PI * 2;
        const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.7, 16), matChrome);
        spoke.position.set(Math.cos(spokeAngle) * 0.35, Math.sin(spokeAngle) * 0.35, 0);
        spoke.rotation.z = spokeAngle + Math.PI / 2;
        turnWheelGroup.add(spoke);

        const grip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), matGold);
        grip.position.set(Math.cos(spokeAngle) * 0.7, Math.sin(spokeAngle) * 0.7, 0);
        turnWheelGroup.add(grip);
    }

    // =========================================================================
    // 6. ANIMATION LOOP — Pure Scroll-Driven
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

    let clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const elapsedTime = clock.getElapsedTime();

        // Scroll progress
        targetScrollProgress = calculateScrollProgress();
        currentScrollProgress = lerp(currentScrollProgress, targetScrollProgress, 0.08);
        const progress = currentScrollProgress;

        // Hide scroll cue early
        if (scrollCue) {
            scrollCue.style.opacity = progress > 0.04 ? '0' : '1';
        }

        // Canvas fade-out as user scrolls past vault opening
        // At 60%+ scroll the vault is fully faded, content takes over
        const canvasFade = 1 - clamp((progress - 0.5) / 0.25, 0, 1);
        canvas.style.opacity = canvasFade;

        // Vault internal glow grows as door opens
        vaultInternalLight.intensity = clamp(progress * 4, 0, 2.5);

        // 1. Rotate mechanical gears and turning wheel
        const wheelSpin = clamp(progress / 0.25, 0, 1) * Math.PI * 1.5;
        turnWheelGroup.rotation.z = wheelSpin;
        comboDialGroup.rotation.z = -wheelSpin * 2.5;

        mainGear.rotation.z = wheelSpin;
        gears.forEach((gear, idx) => {
            if (idx > 0) gear.rotation.z = -wheelSpin * 1.8;
        });

        // 2. Bolt retraction
        const boltRetract = clamp(progress * 4, 0, 1);
        bolts.forEach((bolt) => {
            if (bolt.userData.initialX !== undefined) {
                const baseRetracted = bolt.userData.initialX;
                const baseExtended = bolt.userData.extendedX;
                bolt.position.x = lerp(baseExtended, baseRetracted, boltRetract);
            } else if (bolt.userData.initialY !== undefined) {
                const baseRetracted = bolt.userData.initialY;
                const baseExtended = bolt.userData.extendedY;
                bolt.position.y = lerp(baseExtended, baseRetracted, boltRetract);
            }
        });

        // 3. Door Swing open (starts at 15%, full open at 55%)
        let doorAngle = 0;
        if (progress > 0.15) {
            const doorOpenT = clamp((progress - 0.15) / 0.4, 0, 1);
            // Ease out cubic for smooth door swing
            const eased = 1 - Math.pow(1 - doorOpenT, 3);
            doorAngle = -eased * (Math.PI * 0.48); // ~86 degrees
        }
        doorPivot.rotation.y = doorAngle;

        // 4. Camera slowly advances forward as vault opens (entering the vault)
        const camZ = 8.2 - progress * 3.5;
        const camY = 0.2 - progress * 0.15;
        camera.position.z = lerp(camera.position.z, camZ, 0.06);
        camera.position.y = lerp(camera.position.y, camY, 0.06);

        // Subtle gentle float
        vaultRoot.rotation.y = Math.sin(elapsedTime * 0.3) * 0.02;
        vaultRoot.rotation.x = Math.cos(elapsedTime * 0.25) * 0.01 + 0.04;
        vaultRoot.position.y = Math.sin(elapsedTime * 0.5) * 0.03;

        camera.lookAt(0, 0, 0);
        renderer.render(scene, camera);
    }

    animate();

    // =========================================================================
    // 7. RESIZE
    // =========================================================================
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // =========================================================================
    // 8. MOBILE NAV & FORM
    // =========================================================================
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

    // Toast
    function showToast(message, duration = 4000) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, duration);
    }

    // Contact Form
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

            setTimeout(() => {
                if (confirm('¿Deseas enviar también estos detalles directamente a nuestro WhatsApp oficial?')) {
                    window.open(`https://wa.me/18295964439?text=${waText}`, '_blank');
                }
            }, 800);
        });
    }

})();
