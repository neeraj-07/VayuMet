// mapInit.js
export function initializeMap() {
    const map = L.map('map', {
        center: [20.5, 80],
        zoom: 4,
        timeDimension: true,
        fullscreenControl: true,
        zoomSnap: .25
    });

    const timeControl = L.control.timeDimension({
        position: "bottomleft",
        playerOptions: {
            transitionTime: 1000,
            loop: false,
            minBufferTime: 5
        }
    });
    timeControl.addTo(map);
    timeControl.getContainer().style.display = 'none'; // Hidden by default

    // Add VayuMet logo beside zoom control
    const LogoControl = L.Control.extend({
        onAdd: function () {
            const img = L.DomUtil.create("img");
            img.src = "./logo/VayuMet_logo.png";
            img.alt = "VayuMet Logo";
            img.style.width = "40px";
            img.style.marginleft = "20px";
            return img;
        },
    });
    map.addControl(new LogoControl({ position: "topleft" }));

    return { map, timeControl };
}