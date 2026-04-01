import type { FPGATarget } from '../types';

export const FPGA_TARGETS: FPGATarget[] = [
    {
        id: "zynq_7020",
        name: "Zynq-7020",
        family: "Zynq-7000",
        luts: 53200,
        ffs: 106400,
        dsps: 220,
        brams: 140
    },
    {
        id: "zynq_ultrascale_zu3eg",
        name: "Zynq UltraScale+ ZU3EG",
        family: "UltraScale+",
        luts: 70560,
        ffs: 141120,
        dsps: 360,
        brams: 216
    },
    {
        id: "artix_7_35t",
        name: "Artix-7 35T",
        family: "Artix-7",
        luts: 20800,
        ffs: 41600,
        dsps: 90,
        brams: 50
    },
    {
        id: "virtex_ultrascale_vu9p",
        name: "Virtex UltraScale+ VU9P",
        family: "UltraScale+",
        luts: 1182240,
        ffs: 2364480,
        dsps: 6840,
        brams: 2160
    },
    {
        id: "kria_kv260",
        name: "Kria KV260",
        family: "UltraScale+",
        luts: 117120,
        ffs: 234240,
        dsps: 1248,
        brams: 144
    }
];
