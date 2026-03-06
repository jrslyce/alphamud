export const BASE_CHASSIS = {
    name: "SIP-01 Mirror",
    weight: 4800,
    stability: 1000,
    enCapacity: 1200,
    heatLimit: 500,
    compute: 210,
    si: 5000,
    dissipation: 15
};

export const MANIFEST = {
    thrusters: [
        { id: "T-800", name: "Standard Jet", thrust: 550, weight: 250, heat: 12, cost: 500 },
        { id: "T-120", name: "Kaminari Spark", thrust: 400, weight: 120, heat: 8, cost: 450 },
        { id: "T-Heavy", name: "Atlas Burner", thrust: 950, weight: 600, heat: 22, cost: 750 },
        { id: "T-Ghost", name: "Phase-Shifter", thrust: 480, weight: 180, heat: 5, cost: 800 },
        { id: "T-Drgn", name: "Dragoon-X", thrust: 1200, weight: 800, heat: 45, cost: 1200 },
        { id: "T-Pulse", name: "Flare-Point", thrust: 600, weight: 200, heat: 18, cost: 550 },
        { id: "T-Titan", name: "Crank-Shaft", thrust: 850, weight: 500, heat: 14, cost: 700 },
        { id: "T-Shgn", name: "Shogun Drift", thrust: 700, weight: 350, heat: 10, cost: 650 },
        { id: "T-Rail", name: "Vector Rail", thrust: 1100, weight: 700, heat: 30, cost: 950 },
        { id: "T-Nova", name: "Supernova", thrust: 1500, weight: 950, heat: 65, cost: 1500 }
    ],
    batteries: [
        { id: "B-Volt", name: "Volt-Cell XL", en: 450, weight: 400, heat: 2, cost: 400 },
        { id: "B-Ion", name: "Ion-Core S", en: 200, weight: 100, heat: 1, cost: 300 },
        { id: "B-Fuse", name: "Fusion-Box", en: 1200, weight: 950, heat: 8, cost: 900 },
        { id: "B-Sink", name: "Kinetic Sink", en: 600, weight: 700, heat: 0, cost: 700 },
        { id: "B-Plsm", name: "Plasma Well", en: 800, weight: 550, heat: 12, cost: 850 },
        { id: "B-Sold", name: "Solid State", en: 500, weight: 300, heat: 4, cost: 500 },
        { id: "B-Star", name: "Neutron Star", en: 2000, weight: 1800, heat: 15, cost: 1500 },
        { id: "B-Zero", name: "Zero-Point", en: 900, weight: 400, heat: 6, cost: 2000 },
        { id: "B-Lead", name: "Retro-Crank", en: 700, weight: 1100, heat: 2, cost: 450 },
        { id: "B-Tube", name: "Carbon-Tube", en: 350, weight: 80, heat: 5, cost: 600 }
    ],
    fcs: [
        { id: "F-Hawk", name: "Hawk-Eye", lockOn: 0.4, weight: 50, heat: 5, cost: 350 },
        { id: "F-Snpr", name: "Sniper-X", lockOn: 1.2, weight: 150, heat: 15, cost: 600 },
        { id: "F-Wide", name: "Wide-Glance", lockOn: 0.2, weight: 20, heat: 2, cost: 300 },
        { id: "F-Echo", name: "Echo-Loc", lockOn: 0.5, weight: 80, heat: 4, cost: 400 },
        { id: "F-Pred", name: "Predator", lockOn: 0.7, weight: 110, heat: 12, cost: 550 },
        { id: "F-Sent", name: "Sentinel", lockOn: 0.3, weight: 200, heat: 3, cost: 500 },
        { id: "F-Orcl", name: "Oracle Lens", lockOn: 0.9, weight: 100, heat: 10, cost: 800 },
        { id: "F-Vipr", name: "Viper Strike", lockOn: 1.0, weight: 90, heat: 18, cost: 750 },
        { id: "F-Dish", name: "Radar Dish", lockOn: 0.6, weight: 350, heat: 6, cost: 450 },
        { id: "F-Cybr", name: "Cyber-Eye", lockOn: 0.8, weight: 40, heat: 22, cost: 900 }
    ],
    cores: [
        { id: "C-Deep", name: "Deep-Mind v1", compute: 80, weight: 100, heat: 22, cost: 600 },
        { id: "C-Gate", name: "Logic-Gate", compute: 40, weight: 50, heat: 8, cost: 400 },
        { id: "C-Qunt", name: "Quantum-X", compute: 250, weight: 200, heat: 85, cost: 1500 },
        { id: "C-Neur", name: "Neural-Net v4", compute: 120, weight: 120, heat: 35, cost: 850 },
        { id: "C-Rflx", name: "Reflex-Core", compute: 180, weight: 150, heat: 50, cost: 1100 },
        { id: "C-Lord", name: "Overlord CPU", compute: 150, weight: 300, heat: 40, cost: 1200 },
        { id: "C-Zen", name: "Zen-Proc", compute: 100, weight: 80, heat: 15, cost: 900 },
        { id: "C-Brut", name: "Brute-Force", compute: 200, weight: 250, heat: 70, cost: 1300 },
        { id: "C-Synp", name: "Synapse", compute: 140, weight: 110, heat: 28, cost: 950 },
        { id: "C-Ghst", name: "Ghost-Code", compute: 160, weight: 40, heat: 60, cost: 2000 }
    ],
    armor: [
        { id: "A-Slab", name: "Slab-V Armor", stability: 300, weight: 550, si: 400, cost: 450 },
        { id: "A-Nano", name: "Nano-Mesh", stability: 150, weight: 100, si: 100, cost: 500 },
        { id: "A-Plat", name: "Titan Plate", stability: 600, weight: 1200, si: 800, cost: 850 },
        { id: "A-Reac", name: "Reactive Armor", stability: 200, weight: 300, si: 200, cost: 600 },
        { id: "A-Kevl", name: "Weave-Kevlar", stability: 100, weight: 50, si: 150, cost: 400 },
        { id: "A-Cera", name: "Ceramic Plate", stability: 400, weight: 400, si: 300, cost: 700 },
        { id: "A-Void", name: "Void Shield", stability: 500, weight: 100, si: 50, cost: 1500 },
        { id: "A-Buff", name: "Buffer Brace", stability: 250, weight: 450, si: 600, cost: 550 },
        { id: "A-Grid", name: "Power Grid", stability: 150, weight: 200, si: 100, cost: 450 },
        { id: "A-Apex", name: "Apex Guard", stability: 800, weight: 1500, si: 1200, cost: 2000 }
    ]
};

export const CHIPS = [
    { id: "CH-Jab", name: "Quick Jab", damage: 110, en: 60, heat: 5, success: 0.92 },
    { id: "CH-Hook", name: "Steel Hook", damage: 240, en: 150, heat: 15, success: 0.78 },
    { id: "CH-Slam", name: "Gravity Slam", damage: 550, en: 450, heat: 55, success: 0.55 },
    { id: "CH-Pry", name: "Pulse Parry", damage: 0, en: 120, heat: 10, success: 0.65 },
    { id: "CH-Tckl", name: "Sonic Tackle", damage: 320, en: 250, heat: 35, success: 0.70 },
    { id: "CH-Kick", name: "Rocket Kick", damage: 400, en: 320, heat: 40, success: 0.62 },
    { id: "CH-Spin", name: "Cyclone Spin", damage: 380, en: 400, heat: 45, success: 0.68 },
    { id: "CH-Upper", name: "Nova Uppercut", damage: 600, en: 500, heat: 70, success: 0.45 }
];
