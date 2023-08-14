import React from "react";
import { useState } from "react";
import Button from "@mui/material/Button";

const Learn = () => {
  const [page, setPage] = useState(1);

  const handlePrev = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (page < 5) {
      setPage(page + 1);
    }
  };

  const steps = [
    {
      id: 1,
      title: "Step 1: First Login & Click on the button Start Creating Dataset",
      description:
        "To create a new training dataset, start by clicking on the 'Start Creating Dataset' button.",
      image: "/learn-resources/1.png",
    },
    {
      id: 2,
      title: "Step 2: Click on the button Create New",
      description:
        "After clicking on 'Start Creating Dataset', click on the 'Create New' button to create a new dataset.",
      image: "/learn-resources/2.png",
    },
    {
      id: 3,
      title: "Step 3: Click on the input field , Give your Dataset Name",
      description:
        "To name your dataset, click on the input field and type in your desired name & click on the 'Create Training Dataset'",
      image: "/learn-resources/3.png",
    },
    {
      id: 4,
      title: "Step 4: Find Image to Train",
      description:
        "After creating Dataset You will see following screen , Now Open Open Aerial Map in New Tab , https://openaerialmap.org/",
      image: "/learn-resources/4.png",
    },
    {
      id: 5,
      title: "Step 5: Find Drone Image and Copy TMS URL",
      description:
        "Look for your area and find good Drone Image for training . After finding , Click on Copy Image URL TMS",
      image: "/learn-resources/5.png",
    },
    {
      id: 6,
      title: "Step 6: Paste TMS To Open Aerial Imagery Tab",
      description:
        "Paste your TMS URL that you have copied from Open Aerial Map Drone Image",
      image: "/learn-resources/6.png",
    },
    {
      id: 7,
      title: "Step 7: Zoom to Layer and Visualize Image",
      description:
        "Click on Zoom to layer next to your Image name in OAM Block Top Right side of screen",
      image: "/learn-resources/7.png",
    },
    {
      id: 8,
      title: "Step 8: Create Area of Interest for Training",
      description:
        "Click on top left map buttons below zoom , To create AOI , AOI will be used to create labels. Labels are Buildings that will be acting as input for model inside AOI",
      image: "/learn-resources/8.png",
    },
    {
      id: 9,
      title: "Step 9: Fetch Exisiting OSM Buildings in your Area of Interest",
      description:
        "Click on Fetch OSM Data button next to OSM Logo Inside List of Area of Interest on Right side.",
      image: "/learn-resources/9.png",
    },
    {
      id: 10,
      title: "Step 10: Visualize each Buildings to check their accuracy",
      description:
        "Zoom to Level 20 in Map to see OSM Buildings that you have just fetched",
      image: "/learn-resources/10.png",
    },
    {
      id: 11,
      title: "Step 11: Correct your labels",
      description:
        "For training it is crucial that buildings are aligned exactly on Drone image, More good your input is more good your output will be. If you want to edit it Click on OSM Logo and Fix buildings / labels in your AOI",
      image: "/learn-resources/11.png",
    },
    {
      id: 12,
      title: "Step 12: Upload your fixes",
      description:
        "You should see your AOI in ID , Fix your labels and Upload your changes to OSM",
      image: "/learn-resources/osm.png",
    },
    {
      id: 13,
      title: "Step 13: Come Back to fAIr , Fetch OSM Labels",
      description:
        "After you do your changes on OSM , Comeback to fAIr and fetch new labels, Give it a few min to update our database ( Click on button next to OSM Logo on AOI to fetch -Step 9)",
      image: "/learn-resources/12.png",
    },
    {
      id: 14,
      title: "Step 14: Create Model for you Dataset",
      description:
        "Click on View Models on your dataset page , You will see this page. Click on Create New",
      image: "/learn-resources/13.png",
    },
    {
      id: 15,
      title: "Step 15: Provide Model Metadata",
      description:
        "Give your model name , Choose Your Dataset from Dropdown , Select BaseModel : RAMP is default for now , Click on Create AI Model",
      image: "/learn-resources/14.png",
    },
    {
      id: 16,
      title: "Step 16: Create Training for Your Model",
      description:
        "After creating Model for your dataset you will see following page. From here You can submit Trainings for your model. Give your epochs , Batch size and Zoom level for Training . Epochs refers to the number of times the learning algorithm will go through the entire training dataset, recommended between 20 - 60.  Batch size refers to number of sample pairs to work through before updating the internal model parameters. 8 is recommended and preferred to be 8, 16, 32 ...etc . Zoom levels are the image sizes that will be downloaded during trainings (20 is recommended ) You can train on all of zoom levels . you can play with the parameters for your training after visualizing your results , Increase- Decrease batchsize / epochs or your training labels to achieve best performing model , You can Use Goldilocks Method to find best parameter for your dataset",
      image: "/learn/15.png", // Add image URL here
    },
    {
      id: 17,
      title: "Step 17: Submit Your Training",
      description:
        "Click on Submit Training Request and slide down, you will see your training listed there , You can check its status by clicking on info, Based on your dataset , AOI , your parameter model training may take time you can check progress on status. SUBMITTED , RUNNING , FINISHED . You can see your model accuracy and use it after it is finished. If it fails you can check the reason for it and adapt accordingly",
      image: "/learn/16.png", // Add image URL here
    },
    {
      id: 18,
      title: "Step 18: Check info of your Trainings",
      description:
        "Click on i icon button next to your training to visualize current terminal and process of your training , It will display accuracy validation graph after training is finished",
      image: "/learn/17.png", // Add image URL here
    },
    {
      id: 19,
      title: "Step 19: Finished Training",
      description:
        "You can visualize your trainings accuracy and it's graph after it is finished like this",
      image: "/learn/18.png", // Add image URL here
    },
    {
      id: 20,
      title: "Step 20: Publish Your Training",
      description:
        "Once you are statisfied accuracy and want to visualize its prediction you need to publish the training. You can run multiple trainings for same model to find best performing checkpoint, Each training will result different checkpoint. You can always publish another training. Click on PUblish Training button to Publish Model",
      image: "/learn/19.png", // Add image URL here
    },
    {
      id: 21,
      title: "Step 21: Start Mapping",
      description:
        "Once Model is Published it will be listed here on Model page as Published Training ID , Click on Start Mapping to See its Prediction",
      image: "/learn/20.png", // Add image URL here
    },
    {
      id: 22,
      title: "Step 22: Visualize Your Model's Prediction",
      description:
        "Zoom to the area you want to see predictions and Click Detect to Run your Published training Model. It will load the model and Run live predictions ",
      image: "/learn/21.png", // Add image URL here
    },
    {
      id: 23,
      title: "Step 23: Bring Predictions to OSM",
      description:
        "Your Predictions will be visualized on Map, Now you can bring them to OSM Modify them remove bad predictions and Push it back to OSM. fAIr should be able to have feedback loop when user discards the prediction or modifies it ( it is work in Prrogress) , you can launch JOSM with prediction data though",
      image: "/learn/22.png", // Add image URL here
    },
  ];

  const startIndex = (page - 1) * 5;
  const endIndex = startIndex + 5;
  const stepsToShow = steps.slice(startIndex, endIndex);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: "80%", maxWidth: "800px" }}>
          {stepsToShow.map((step) => (
            <div key={step.id}>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
              <img
                src={step.image}
                alt={step.title}
                style={{ maxWidth: "100%", maxHeight: "400px" }}
              />
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Button variant="contained" onClick={handlePrev}>
              Previous
            </Button>
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Learn;
