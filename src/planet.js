/**
 * Interactive 3d planetary visualization of global covid-19 data across 2020.
 * @author Matthew Di Marco
 */

//Globals
var scene, 
    cam, 
    renderer, 
    earth, 
    satellite,
    timelineIdx;

//Constants
const cBlack = "#0f0f0f",
      cRed = "#FE2E2E",
      aspect = window.innerWidth/window.innerHeight,
      detailFactor = 5;

/**
 * Represent the planet and it's regions.
 */
class Planet
{
    constructor(radius, texturePath)
    {
        const detail = 12 * detailFactor;
        var geometryPlanet, materialPlanet, texturePlanet;

        geometryPlanet = new THREE.SphereGeometry(radius, detail, detail);
        texturePlanet = new THREE.TextureLoader().load(texturePath);
        materialPlanet = new THREE.MeshBasicMaterial({map: texturePlanet});

        this.radius = radius;
        this.planet = new THREE.Mesh(geometryPlanet, materialPlanet);
        this.regions = [];

        scene.add(this.planet);
    }

    /**
     * Spawns a new region at at [x,y,z] along this planet's surface given lat/long.
     * @param lat Latitude
     * @param long Longitude
     */
    spawnRegion(lat, long)
    {
        var region = new Region(lat, long);
        region.plotFromGeoCoords(this, lat, long);
        scene.add(region.dome);
        this.regions.push(region);
    }

    /**
     * Uses the global coords array to spawn and map regions to Earth model
     */
    loadRegions()
    {
        for(ii = 0; ii < coords.length; ii++)
        {
            earth.spawnRegion(
                coords[ii][0],
                coords[ii][1]
            );
        }
    }
}

/**
 * Represents a region.
 */
class Region 
{
    constructor(lat, long) 
    {
        this.infected = 0;

        const detail = 4 * detailFactor;
        this.dome = new THREE.Mesh(
            new THREE.SphereGeometry(0.001, detail, detail),
            new THREE.MeshBasicMaterial({
                color: cRed, 
                opacity: .50, 
                transparent: true
            })
        );
    }

    /**
     * Set the number of infected in this region and scale the mesh
     * @param newInfected 
     */
    setStats(newInfected)
    {
        this.infected = newInfected;

        //scale the mesh
        var scale = 1;
        if(newInfected >= 1)
        {
            scale += 10 + (2 * (newInfected / 1000));
        }

        this.dome.scale.set(scale, scale, scale);
    }

    /**
     * Plot the region's [x,y,z] position in space from Geographic coordinates.
     * @param radius The planet's to get radius from
     * @param lat Latitudinal position
     * @param long Longitudinal position
     */
    plotFromGeoCoords(planet, lat, long)
    {
        var phi = (90-lat) * (Math.PI / 180);
        var theta = (long + 180) * (Math.PI / 180);
    
        this.dome.position.x = -((planet.radius) * Math.sin(phi) * Math.cos(theta));
        this.dome.position.y = ((planet.radius) * Math.cos(phi));
        this.dome.position.z = ((planet.radius) * Math.sin(phi) * Math.sin(theta));
    }
}

/**
 * Initialises the scene.
 */
function init()
{
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setClearColor(cBlack);
    renderer.setSize(window.innerWidth, window.innerHeight);

    //add to html doc
    document.body.appendChild(renderer.domElement);

    renderer.render(scene, cam);
    cam.position.z = 3;

    //create the Earth
    earth = new Planet(1, 'assets/textures/earth-texture.jpg');

    //user controls
    satellite = new THREE.OrbitControls(cam, renderer.domElement);
    satellite.target.set( 0, 0, 0 )
    satellite.enablePan = false;
    satellite.autoRotate = true;
    satellite.enableDamping = true;
    satellite.autoRotateSpeed = 0.5;
    satellite.dampingFactor = 0.1;

    loadData();
}

/**
 * Calls and awaits for file reader function.
 */
async function loadData()
{
    await getDataFromFiles();
    earth.loadRegions();

    //adjust slider
    var slider = document.getElementById('timeline');
    slider.min = 0;
    slider.max = dates.length - 1;
    slider.value = dates.length - 1;
}

/**
 * Change timeline index and update regions accordingly
 * @param newTimelineIdx 
 */
function shiftTimeline(newTimelineIdx) 
{
    timelineIdx = newTimelineIdx;
    for(ii = 0; ii < earth.regions.length; ii++)
    {
        earth.regions[ii].setStats(matrixInfected[ii][timelineIdx]);
    }
}

/**
 * Render loop
 */
function draw()
{
    requestAnimationFrame(draw);

    //stats
    document.getElementById('infected').innerHTML = "Infected " + arrTotalInfected[timelineIdx];
    document.getElementById('deceased').innerHTML = "Deceased " + arrTotalDeceased[timelineIdx];
    document.getElementById('recovered').innerHTML = "Recovered " + arrTotalRecovered[timelineIdx];

    //slider
    var slider = document.getElementById('timeline');
    document.getElementById('date').innerHTML = dates[slider.value];
    if(slider.value != timelineIdx)
    {
        shiftTimeline(slider.value);
    }

    //everything else
    renderer.render(scene, cam);
    satellite.update();
}

init();
draw();