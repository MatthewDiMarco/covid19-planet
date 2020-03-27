/**
 * Contains functionality responsible for extracting csv covid-19 data.
 */

/**
 * 2d matricies containing covid-19 data.
 * row = region, col = date
 */
var matrixInfected, matrixDeceased, matrixRecovered;

//Contains totals for each date in the corresponding matrix.
var arrTotalInfected, arrTotalDeceased, arrTotalRecovered;

//arr storing lat/long of regions
var coords = [];
var dates;

//Files
const infected = 'assets/data/time_series_covid19_confirmed_global.csv';
const deceased = 'assets/data/time_series_covid19_deaths_global.csv';
const recovered = 'assets/data/time_series_covid19_recovered_global.csv'; 

/** 
 * Populates coords and matricies with data from the csv files.
 */
async function getDataFromFiles()
{
    //fetch infected
    const responseInfected = await fetch(infected);
    const dataInfected = await responseInfected.text();

    //fetch deceased
    const responseDeceased = await fetch(deceased);
    const dataDeceased = await responseDeceased.text();

    //fetch recovered
    const responseRecovered = await fetch(recovered);
    const dataRecovered = await responseRecovered.text();

    //split lines and delete headers (no data)
    var rowsInfected = dataInfected.split('\n');
    dates = rowsInfected[0].split(',').splice(4);
    rowsInfected = rowsInfected.splice(1);
    var rowsDeceased = dataDeceased.split('\n').splice(1);
    var rowsRecovered = dataRecovered.split('\n').splice(1);

    //init arrays (date columns start at idx 4)
    const dateIdxOffset = 4;
    const numDates = rowsInfected[0].split(',').length - dateIdxOffset;

    arrTotalInfected = new Array(numDates).fill(0);
    arrTotalDeceased = new Array(numDates).fill(0);
    arrTotalRecovered = new Array(numDates).fill(0);

    matrixInfected = [], matrixDeceased = [], matrixRecovered = [];

    //extract contents
    for(ii = 0; ii < rowsInfected.length; ii++) //cycle rows
    {
        //new row for the matricies
        matrixInfected.push(new Array());
        matrixDeceased.push(new Array());
        matrixRecovered.push(new Array());

        //split columns
        const currRowInfected = rowsInfected[ii].split(',');
        const currRowDeceased = rowsDeceased[ii].split(',');
        const currRowRecovered = rowsRecovered[ii].split(',');

        //get coordinates
        const lat = currRowInfected[2]; 
        const long = currRowInfected[3];
        coords.push([parseFloat(lat),parseFloat(long)]);

        //cycle dates
        for(jj = dateIdxOffset; jj < currRowInfected.length; jj++)
        {
            //add to totals
            arrTotalInfected[jj-dateIdxOffset] += parseInt(currRowInfected[jj]);
            arrTotalDeceased[jj-dateIdxOffset] += parseInt(currRowDeceased[jj]);
            arrTotalRecovered[jj-dateIdxOffset] += parseInt(currRowRecovered[jj]);

            //add data to matricies
            matrixInfected[ii].push(parseInt(currRowInfected[jj]));
            matrixDeceased[ii].push(parseInt(currRowDeceased[jj]));
            matrixRecovered[ii].push(parseInt(currRowRecovered[jj]));
        }
    }
}