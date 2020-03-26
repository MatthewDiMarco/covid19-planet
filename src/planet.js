/**
 * An interactive 3d planetary visualization of covid-19 global data across 2020.
 * @author Matthew Di Marco and ...
 */

//Globals
var scene, 
    cam, 
    renderer, 
    earth, 
    controls,
    timelineIdx;

//Constants
const cGrey = "#151515",
      cRed = "#FE2E2E",
      aspect = window.innerWidth/window.innerHeight,
      earthRadius = 1,
      earthDetail = 24,
      earthTexturePath = 'assets/textures/earth-texture.jpg';

/**
 * Class for representing the planet
 */
class Planet
{
    constructor(radius, texturePath)
    {
        var geometryPlanet, materialPlanet, texturePlanet;

        geometryPlanet = new THREE.SphereGeometry(radius, earthDetail, earthDetail);
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
 * Class for representing a region on a planet.
 */
class Region 
{
    constructor(lat, long) 
    {
        this.infected = 0;
        this.deceased = 0;
        this.recovered = 0;

        this.dome = new THREE.Mesh(
            new THREE.SphereGeometry(0.01, 8, 8),
            new THREE.MeshBasicMaterial({color: cRed})
        );
    }

    /**
     * Increments the current stat values by numX amount.
     * @param newInfected 
     * @param newDeceased 
     * @param numRecovered 
     */
    updateStats(newInfected, newDeceased, numRecovered)
    {
        this.infected = newInfected;
        this.deceased = newDeceased;
        this.revocered = numRecovered;

        //scale the mesh
        const scale = (this.normalise(newInfected, 0, 5));
        this.dome.scale.set(scale, 
                            scale, 
                            scale);
    }

    /**
     * Crunch any real number 'x' into a value between lower and upper.
     * @param x
     * @param lower 
     * @param upper 
     */
    normalise(x, lower, upper)
    {
        return (upper - lower) / (1 + Math.exp(-x)) + lower;
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
    renderer.setClearColor(cGrey);
    renderer.setSize(window.innerWidth, window.innerHeight);

    //add to html doc
    document.body.appendChild(renderer.domElement);

    renderer.render(scene, cam);
    cam.position.z = 3;

    //create the Earth
    earth = new Planet(earthRadius, earthTexturePath);

    //controls
    controls = new THREE.OrbitControls(cam, renderer.domElement);
    controls.target.set( 0, 0, 0 )
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;

    loadData();
}

/**
 * Calls and awaits for file reader function.
 */
async function loadData()
{
    await getDataFromFiles();
    earth.loadRegions();
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
        earth.regions[ii].updateStats(matrixInfected[ii][timelineIdx],
                                      matrixDeceased[ii][timelineIdx],
                                      matrixRecovered[ii][timelineIdx]);
    }
}

/**
 * Render loop
 */
function draw()
{
    requestAnimationFrame(draw);
    document.getElementById('infected').innerHTML = "INFECTED " + arrTotalInfected[timelineIdx];
    document.getElementById('deceased').innerHTML = "DECEASED " + arrTotalDeceased[timelineIdx];
    document.getElementById('recovered').innerHTML = "RECOVERED " + arrTotalRecovered[timelineIdx];
    renderer.render(scene, cam);
    controls.update();
}

//Start program
init();
shiftTimeline(0);
draw();