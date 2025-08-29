// constants.js
export const weatherIcons = {
    "TS": "thunderstorms.svg", "TS HZ": "thunderstorms.svg", "TSRA": "thunderstorms.svg", "+TSRA": "thunderstorms.svg", "-TSRA": "thunderstorms.svg", "VCTS": "thunderstorms.svg",
    "DZ": "rainy-1.svg", "+DZ": "rainy-1.svg", "-DZ": "rainy-1.svg", "-DZ BR": "rainy-1.svg", "DZ VCSH": "rainy-1.svg", "RA": "rainy-3.svg", "-RA": "rainy-3.svg", "-RA DZ": "rainy-1.svg", "-RA BR": "rainy-1.svg", "+RA BR": "rainy-3.svg", "RA BR": "rainy-3.svg", "+RA": "rainy-3.svg", "SN": "snowy-3.svg", "+SN": "snowy-3.svg", "-SN": "snowy-2.svg", "SHRA": "rainy-3.svg", "-SHRA": "rainy-3.svg", "+SHRA": "rainy-3.svg", "VCRA": "rainy-1.svg", "VCSH": "rainy-3.svg",
    "BR": "fog.svg", "FG": "fog.svg", "MIFG": "fog.svg",
    "HZ": "haze.svg", "FU": "haze.svg", "DU": "dust.svg", "DS": "dust.svg", "DRDU": "dust.svg", "BLDU": "dust.svg", "PO": "dust.svg",
    "CLR": "clear-night.svg", "CAVOK": "clear-night.svg",
    "FAIR": "cloudy-1-night.svg", "PCLOUDY": "cloudy-2-night.svg", "CLOUDY": "cloudy-3-night.svg", "OVC": "cloudy.svg"
};

export const flightCategoryColors = {
    "VFR": "#00aa00",
    "MVFR": "#0000ff",
    "IFR": "#ff0000",
    "LIFR": "#aa00aa",
    "Unknown": "#aaaaaa"
};

export const weatherElements = {
    Rain: { folder: "rain", suffix: "raint.png", opacity: 0.9, name: "Rain" },
    Clouds: { folder: "clouds", suffix: "tcldt.png", opacity: 0.9, name: "Clouds" },
    CloudLayer: { folder: "cloudlayer", suffix: "cldt.png", opacity: 0.9, name: "Cloud Layer" },
    ConvectiveClouds: { folder: "convection", suffix: "CB.png", opacity: 0.9, name: "Convective Clouds" },
    RadarReflectivity: { folder: "radref", suffix: "radart.png", opacity: 0.9, name: "Radar Reflectivity" },
    WindShear: { folder: "WindShear", suffix: "llwst.png", opacity: 0.7, name: "Wind Shear" },
    CAT_FL180: { folder: "turbulence", suffix: "500hPa_turbulence.png", opacity: 0.9, name: "CAT FL180" },
    CAT_FL300: { folder: "turbulence", suffix: "300hPa_turbulence.png", opacity: 0.9, name: "CAT FL300" },
    CAT_FT450: { folder: "turbulence", suffix: "200hPa_turbulence.png", opacity: 0.9, name: "CAT FT450" },
    Icing_FT140: { folder: "icing", suffix: "600mb_icet.png", opacity: 0.9, name: "Icing FT140" },
    Icing_FL180: { folder: "icing", suffix: "500mb_icet.png", opacity: 0.9, name: "Icing FL180" },
    Icing_FL240hPa: { folder: "icing", suffix: "400mb_icet.png", opacity: 0.9, name: "Icing FL240" },
    WindEnergyPotential: { folder: "windpower", suffix: "wipt.png", opacity: 0.9, name: "WindPowerDensity" },
    SolarPowerPotential: { folder: "solar", suffix: "solpt.png", opacity: 0.9, name: "SolarPowerPotential" },
    "PM2.5": { folder: "PM2.5", suffix: "pmft.png", opacity: 0.9, name: "PM2.5" },
    PM10: { folder: "PM10", suffix: "pmct.png", opacity: 0.9, name: "PM10" }
};

export const imageBounds = [[-7.75, 30], [47.75, 130]];

// SIGMET-related constants
export const sigmetHazardColors = {
    TS: "red", ICE: "dodgerblue", TURB: "purple",
    VA: "gray", MTW: "olive", TC: "orange", Unknown: "brown"
};

export const sigmetIconMap = {
    TS: "Tstorms.png", ICE: "SevIcing.png", TURB: "SevTurb.png",
    VA: "VolErruption.png", MTW: "Mountain.png", TC: "TropCyclone.png"
};

export const sigmetHazardLabels = {
    TS: "Thunderstorm", ICE: "Icing", TURB: "Turbulence",
    VA: "Volcanic Ash", MTW: "Mountain Wave", TC: "Tropical Cyclone"
};

export const indianFIRs = ["VIDF", "VABF", "VEGF", "VOMF"];