/*
 * Interactive Temporal Map Application
 * 
 * This application demonstrates several key web development concepts:
 * 
 * 1. GLOBAL VARIABLES: Used to maintain state across functions
 *    - attributes: Array of temporal data attributes (Pop_1985, Pop_1990, etc.)
 *    - expressed: Currently displayed attribute
 *    - index: Current position in the attributes array
 * 
 * 2. EVENT LISTENERS: Enable user interaction
 *    - Slider 'input' event: Responds to slider movements
 *    - Button 'click' events: Handle forward/reverse navigation
 * 
 * 3. ARRAY INDEXING & WRAPPING: Navigate through temporal data
 *    - Forward: index = (index + 1) % attributes.length
 *    - Backward: index = (index - 1 + attributes.length) % attributes.length
 * 
 * 4. SEPARATION OF CONCERNS: Different functions handle different tasks
 *    - processData(): Extracts and prepares data
 *    - createPropSymbols(): Initial map creation
 *    - updatePropSymbols(): Updates existing symbols
 *    - createSequenceControls(): Sets up UI and event listeners
 * 
 * 5. SYNCHRONIZATION: Keep UI elements in sync with data state
 *    - When slider moves, update index and expressed variable
 *    - When buttons are clicked, update slider position
 *    - Always update the map to reflect current state
 */

//this portion creates the map

// Global variables for sequence controls
var minValue;
var attributes = []; // Array to store attribute names for temporal sequence
var expressed; // Currently displayed attribute 
var index = 0; // Current index in the attributes array

//Step 1: Create Map
    function createMap(){

//create the map

map = L.map('map', {
    center:[0,0],
    zoom: 2
});

L.tileLayer('https://api.mapbox.com/styles/v1/fatima-alejo/cm9641e8k003r01qh78je06h6/tiles/512/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoiZmF0aW1hLWFsZWpvIiwiYSI6ImNtOGN4MWEwbTI0eTkyaXBzc2VpZXZqdXcifQ.OOX9uS34z6I0ztBKBPSbtA', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, ' +
                 '© <a href="https://www.mapbox.com/">Mapbox</a>',
    tileSize: 512,
    zoomOffset: -1,
    maxZoom: 19
}).addTo(map);

//call getData funtion
    getData(map);
};

function calculateMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var city of data.features){
        //loop through each year
        for(var year = 1985; year <= 2015; year+=5){
              //get population for current year
              var value = city.properties["Pop_"+ String(year)];
              //add value to array
              allValues.push(value);
        }
    }
    //get minimum value of our array
    minValue = Math.min(...allValues)

    return minValue;
}

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius

    return radius;
};
//Step 3: Add the circle markers for to the map
function createPropSymbols(data){
    //step 4: use the expressed attribute instead of hard-coded value
    //expressed is a global variable that changes based on user interaction
    var attribute = expressed;
    
    // now we create the markers        
            var geojsonMarkerOptions = {
                fillColor: "#ffc5c0",
                color: "#fff",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8,
                radius: 8
            };

        L.geoJSON(data, {
    pointToLayer: function (feature, latlng) {

        // Step 5: determine the value for the selected attribute

        var attValue = Number(feature.properties[attribute]);
        
        // Step 6: Give each feature's circle marker a radius based on its attribute value
        
        geojsonMarkerOptions.radius = calcPropRadius(attValue);

        // Create the circle marker
        
        var layer = L.circleMarker(latlng, geojsonMarkerOptions);

        // Create the popup content
        
        var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p><p><b>" + attribute + ":</b> " + feature.properties[attribute] + "</p>";

        // Attach the popup to the marker
        
        layer.bindPopup(popupContent);

        // Return the circle marker to the L.geoJSON
        
        return layer;
    }
}).addTo(map);
}

//Step 7: slider portion with event listeners

function createSequenceControls(){
    //Create the slider HTML element
    var slider = "<input class='range-slider' type='range'></input>";
    document.querySelector("#panel").insertAdjacentHTML('beforeend',slider);

    //Set slider attributes based on our attributes array
    //Why use attributes.length - 1 for max?
    //Arrays are zero-indexed, so if we have 7 attributes, indices go from 0 to 6
    document.querySelector(".range-slider").max = attributes.length - 1;
    document.querySelector(".range-slider").min = 0;
    document.querySelector(".range-slider").value = index; //start at current index
    document.querySelector(".range-slider").step = 1;

    //Add images to the reverse and forward buttons
    document.querySelector('#reverse').insertAdjacentHTML('beforeend',"<img src='img/leftflower.png' width='30' height='30'>");
    document.querySelector('#forward').insertAdjacentHTML('beforeend',"<img src='img/rightflower.png' width='30' height='30'>");

    //EVENT LISTENERS - This is where the magic happens!
    //Event listeners "listen" for user interactions and respond accordingly
    //They are essential for creating interactive web applications
    
    //Add event listener for the slider
    //The 'input' event fires whenever the slider value changes
    document.querySelector('.range-slider').addEventListener('input', function() {
        //Get the current value from the slider
        //Why do we need parseInt()? Slider values are strings, we need numbers
        index = parseInt(this.value);
        
        //Update the expressed variable to the attribute at the current index
        //This is how we connect the slider position to the data attribute
        expressed = attributes[index];
        
        //Update the map visualization with the new attribute
        updatePropSymbols(expressed);
        
        //Console log for debugging - helps developers understand what's happening
        console.log("Slider moved to index: " + index + ", showing: " + expressed);
    });
    
    //Add event listener for the reverse button
    //The 'click' event fires when the user clicks the button
    document.querySelector('#reverse').addEventListener('click', function() {
        //Decrease the index by 1
        index--;
        
        //Handle wrapping around - if we go below 0, wrap to the end
        //The modulo operator (%) ensures we stay within array bounds
        //Why do we add attributes.length before the modulo?
        //Because JavaScript's modulo can return negative numbers
        index = (index + attributes.length) % attributes.length;
        
        //Update the expressed variable
        expressed = attributes[index];
        
        //Update the slider position to reflect the new index
        //This keeps the UI elements synchronized
        document.querySelector('.range-slider').value = index;
        
        //Update the map
        updatePropSymbols(expressed);
        
        console.log("Reverse clicked, index: " + index + ", showing: " + expressed);
    });
    
    //Add event listener for the forward button
    document.querySelector('#forward').addEventListener('click', function() {
        //Increase the index by 1
        index++;
        
        //Handle wrapping around - if we exceed the array length, wrap to the beginning
        //The modulo operator automatically handles this wrapping
        index = index % attributes.length;
        
        //Update the expressed variable
        expressed = attributes[index];
        
        //Update the slider position
        document.querySelector('.range-slider').value = index;
        
        //Update the map
        updatePropSymbols(expressed);
        
        console.log("Forward clicked, index: " + index + ", showing: " + expressed);
    });
    
    //Why are event listeners important?
    //1. They enable user interaction with the interface
    //2. They create a responsive, dynamic user experience
    //3. They separate user interface logic from data processing
    //4. They follow the event-driven programming paradigm
    
    //Best practices demonstrated here:
    //1. Keep global variables synchronized (index, expressed, slider value)
    //2. Handle edge cases (array bounds wrapping)
    //3. Provide user feedback (console logging)
    //4. Maintain separation of concerns (UI updates, data updates, map updates)
}

//Step 2: importing the GeoJSON data

function getData(map){

    //load the data using fetch funtion

    fetch("data/MegaCities.geojson")
        .then(function(response){
            return response.json();
        })
        .then(function(json){
            //Step 1: Process the data to extract attributes
            //This must happen first because other functions depend on the attributes array
            processData(json);
            
            //Step 2: Calculate the minimum data value
            //This is needed for proportional symbol scaling
            minValue = calculateMinValue(json);
            
            //Step 3: Create the initial proportional symbols
            //This uses the expressed variable set in processData
            createPropSymbols(json);
            
            //Step 4: Create the sequence controls
            //This must happen after processData because it needs the attributes array
            createSequenceControls();
            
            //Why this order matters:
            //1. processData() sets up global variables (attributes, expressed)
            //2. calculateMinValue() needs the data to find scaling values
            //3. createPropSymbols() needs expressed and minValue to draw symbols
            //4. createSequenceControls() needs attributes array to set up interface
        })
};

//Step 2: Process data to extract attribute names for temporal sequence
function processData(data) {
    //create empty array to store temporal attributes
    attributes = [];
    //get the first feature to access its properties
    var properties = data.features[0].properties;
    
    //loop through each property key in the first feature
    for (var attribute in properties) {
        //look for attributes with "Pop_" prefix
        //indexOf() returns -1 if the substring is not found
        if (attribute.indexOf("Pop_") > -1) {
            //add the attribute name to our array
            attributes.push(attribute);
        }
    }
    
    //Why do we extract attributes into an array?
    //1. It allows us to loop through temporal data systematically
    //2. We can use array indexing to move forward/backward through time
    //3. It separates data processing from visualization logic
    //4. Makes the code more maintainable and flexible
    
    //Sort the attributes to ensure they're in chronological order
    //This is important because object properties aren't guaranteed to be in order
    attributes.sort();
    
    //Set the initial expressed attribute to the first one in our array
    //This establishes the starting point for our temporal sequence
    expressed = attributes[0];
    
    return attributes;
}

//Step 3a: Update proportional symbols when attribute changes
function updatePropSymbols(attribute) {
    //Why do we need a separate update function?
    //1. It's more efficient to update existing symbols than recreate them all
    //2. It maintains the separation between creating and updating visualization
    //3. It provides better user experience with smooth transitions
    
    //Loop through each layer on the map
    map.eachLayer(function(layer) {
        //Check if the layer has properties (it's a data layer, not the base map)
        if (layer.feature && layer.feature.properties[attribute]) {
            //Get the attribute value for this feature
            var attValue = Number(layer.feature.properties[attribute]);
            
            //Calculate new radius based on the attribute value
            var radius = calcPropRadius(attValue);
            
            //Update the layer's radius
            layer.setRadius(radius);
            
            //Update the popup content to show the new attribute
            var popupContent = "<p><b>City:</b> " + layer.feature.properties.City + 
                              "</p><p><b>" + attribute + ":</b> " + 
                              layer.feature.properties[attribute] + "</p>";
            
            //Update the popup content
            layer.bindPopup(popupContent);
        }
    });
}

document.addEventListener('DOMContentLoaded',createMap)