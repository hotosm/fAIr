# User Manual for FMTM
<br>
This manual is a step by step guide for the community project managers on how to get started with the fAIr.

- [Prerequisites](#prerequisites)
- [Video Tutorial](#video-tutorial)
- [Steps to create a project in fAIr](#steps-to-create-a-project-in-fair)
- [Steps to start access your project and Start mapping](#steps-to-start-access-your-project-and-start-mapping)
- [Steps to make changes to the prediction of a particular model(even if you are not a project manager)](#steps-to-make-changes-to-the-prediction-of-a-particular-model)
- [Help and Support](#help-and-support)
- [Thank you note](#thank-you)   

## Prerequisites
- Stable Internet connection
- Knowledge on mapping . If you are new to mapping we suggest you to read [this](https://tasks.hotosm.org/learn/map) .
- Very basic knowledge on training AI Datasets and Models.
- Account on [fAIr](https://fair-dev.hotosm.org/) .

## Video Tutorial


https://github.com/hotosm/fAIr/assets/97789856/47121891-b21a-43c0-bb60-1e03f5222c10




https://github.com/hotosm/fAIr/assets/97789856/d7d86a6f-e492-4169-8443-d9924cb10e54




https://github.com/hotosm/fAIr/assets/97789856/f68def4f-6b0b-4870-801c-0fac16713249





https://github.com/hotosm/fAIr/assets/97789856/3da0771d-0346-4042-9049-4f321c27ba8d





https://github.com/hotosm/fAIr/assets/97789856/1e2efaf0-f0c2-4331-a290-566434db5db3






https://github.com/hotosm/fAIr/assets/97789856/a667433b-5d50-4160-b65c-192aaeae79af




https://github.com/hotosm/fAIr/assets/97789856/2dcae84f-b873-42b4-a9bf-93f589b563f4




https://github.com/hotosm/fAIr/assets/97789856/7e29d4ec-65a1-4aef-ab67-42efb94eba6d





https://github.com/hotosm/fAIr/assets/97789856/fe3f55e6-d175-423f-ba71-10283671e0cb





https://github.com/hotosm/fAIr/assets/97789856/47d0a5fe-c606-4168-b401-4b34d70a3a0e




https://github.com/hotosm/fAIr/assets/97789856/43327f2d-e807-46e5-a1db-a8f58091eebd



https://github.com/hotosm/fAIr/assets/97789856/1113b858-67a1-4ec9-8895-a955e7cd9063



https://github.com/hotosm/fAIr/assets/97789856/35ea2f68-92ef-4d8d-bfaf-fb05ec507d5a




https://github.com/hotosm/fAIr/assets/97789856/f4eae99f-e9a2-4424-806f-fdfce80e66dd



https://github.com/hotosm/fAIr/assets/97789856/27fc1a0e-ce58-448c-b220-9c63e41caa3b


## Steps to create a project in fAIr

1. Go to [fAIr](https://fair-dev.hotosm.org/) .

2. First Login & Click on the button Start Creating Dataset.To create a new training dataset, start by clicking on the 'Start Creating Dataset' button.
<img width="1401" alt="2" src="https://github.com/hotosm/fAIr/assets/97789856/183249ae-cc8f-4c25-8e8c-04946bb1a20c">

3. Click on the button Create New.After clicking on 'Start Creating Dataset', click on the 'Create New' button to create a new dataset.
<img width="1419" alt="3" src="https://github.com/hotosm/fAIr/assets/97789856/f1db017c-b360-42aa-bd1f-5c94049fc042">

> A dataset would be a list of area of interests (AIOs) and its labels. OpenStreetMap data can be downlaoded automatically and used as initial
> labels. It is our responsibility as model creators to make sure labels align with the feature before proceeding to training phase.

4. Click on the input field , Give your Dataset Name.To name your dataset, click on the input field and type in your desired name & click on the 'Create Training Dataset'.
<img width="1419" alt="4" src="https://github.com/hotosm/fAIr/assets/97789856/a7628457-2aa0-43f5-be2a-7e4bea022efd">

5. Find Image to Train.After creating Dataset You will see following screen , Now Open Open Aerial Map in New Tab , https://openaerialmap.org/.
<img width="1399" alt="5" src="https://github.com/hotosm/fAIr/assets/97789856/69197409-fde6-4555-a1d3-9c7b33789f8a">

6.  Find Drone Image and Copy TMS URL.Look for your area and find good Drone Image for training . After finding , Click on Copy Image URL TMS.
<img width="1316" alt="6" src="https://github.com/hotosm/fAIr/assets/97789856/41da3fc6-8148-4dc9-9a99-6784b0d0a259">

7. Paste TMS To Open Aerial Imagery Tab.Paste your TMS URL that you have copied from Open Aerial Map Drone Image.
<img width="1416" alt="7" src="https://github.com/hotosm/fAIr/assets/97789856/e8c1409d-764a-4a92-872a-eaae8d8c75f1">

8. Zoom to Layer and Visualize Image.Click on Zoom to layer next to your Image name in OAM Block Top Right side of screen.
<img width="1410" alt="8" src="https://github.com/hotosm/fAIr/assets/97789856/a92deb19-e8ae-42c2-9c05-655b9d4ffec2">

9. Create Area of Interest for Training.Click on top left map buttons below zoom , To create AOI , AOI will be used to create labels. 

> Labels are Buildings that will be acting as input for model inside AOI. 

<img width="1413" alt="9" src="https://github.com/hotosm/fAIr/assets/97789856/ff61462e-02b3-4b23-8e8c-1c80c1582dd1">

10. Fetch Exisiting OSM Buildings in your Area of Interest.Click on Fetch OSM Data button next to OSM Logo Inside List of Area of Interest on Right side.
<img width="378" alt="10" src="https://github.com/hotosm/fAIr/assets/97789856/d318aca6-cdb1-43c4-b31a-1f19259201f7">

11. Visualize each Buildings to check their accuracy.Zoom to Level 20 in Map to see OSM Buildings that you have just fetched.
<img width="1396" alt="11" src="https://github.com/hotosm/fAIr/assets/97789856/a89c5b7d-2796-4281-b8b8-471c5ef8253f">


12. Correct your labels.For training it is crucial that buildings are aligned exactly on Drone image, More good your input is more good your output will be. If you want to edit it Click on OSM Logo and Fix buildings / labels in your AOI.

> Labels are building footprints that are manually dititized on the area.

<img width="360" alt="12" src="https://github.com/hotosm/fAIr/assets/97789856/b7afa0fb-885c-4fb4-8961-38dda083af82">


13. Upload your fixes.You should see your AOI in ID , Fix your labels and Upload your changes to OSM.
<img width="1391" alt="13" src="https://github.com/hotosm/fAIr/assets/97789856/74464efe-e8a0-47c6-bad1-1889389bebcf">



14. Come Back to fAIr , Fetch OSM Labels.After you do your changes on OSM , Comeback to fAIr and fetch new labels, Give it a few min to update our database ( Click on button next to OSM Logo on AOI to fetch).
<img width="1409" alt="14" src="https://github.com/hotosm/fAIr/assets/97789856/45dfe8eb-dbb4-4f16-9ad0-8f81e95fa143">


15. Create Model for you Dataset.Click on View Models on your dataset page , You will see this page. Click on Create New.
<img width="1401" alt="15" src="https://github.com/hotosm/fAIr/assets/97789856/a434e007-fdab-42a8-a764-39bd850377a3">

16. Provide Model Metadata.Give your model name , Choose Your Dataset from Dropdown , Select BaseModel : RAMP is default for now , Click on Create AI Model.
<img width="1402" alt="16" src="https://github.com/hotosm/fAIr/assets/97789856/8b23ca97-c518-419e-aa9b-a3c1887b39dd">


17. Create Training for Your Model.After creating Model for your dataset you will see following page. From here You can submit Trainings for your model. Give your epochs , Batch size and Zoom level for Training .
<img width="1414" alt="17" src="https://github.com/hotosm/fAIr/assets/97789856/0bb4da28-8553-4576-b82a-b0b1e8731e6b">


18. Submit Your Training.Click on Submit Training Request and slide down, you will see your training listed there , You can check its status by clicking on info, Based on your dataset , AOI , your parameter model training may take time you can check progress on status. SUBMITTED , RUNNING , FINISHED .
     You can see your model accuracy and use it after it is finished. If it fails you can check the reason for it and adapt accordingly.
<img width="1423" alt="18" src="https://github.com/hotosm/fAIr/assets/97789856/545bf869-4faf-43af-92b2-3240a7b270b7">


19. Check info of your Trainings.Click on i icon button next to your training to visualize current terminal and process of your training , It will display accuracy validation graph after training is finished.
<img width="1337" alt="19" src="https://github.com/hotosm/fAIr/assets/97789856/f44a9737-65bb-4413-bd3b-ca12d66dfd88">


20. Finished Training.You can visualize your trainings accuracy and it's graph after it is finished like this.
<img width="890" alt="20" src="https://github.com/hotosm/fAIr/assets/97789856/5b860ce3-5c33-49f4-ad1f-33b47d4369b5">


21.  Publish Your Training.Once you are statisfied accuracy and want to visualize its prediction you need to publish the training. You can run multiple trainings for same model to find best performing checkpoint, Each training will result different checkpoint. You can always publish another training. Click on PUblish Training button to Publish Model.
<img width="861" alt="21" src="https://github.com/hotosm/fAIr/assets/97789856/b9963566-c377-489d-8a3d-da0b7e835261">


## Steps to start access your project and Start mapping 

1.  Start Mapping.Once Model is Published it will be listed here on Model page as Published Training ID , Click on Start Mapping to See its Prediction.
<img width="1253" alt="1 1" src="https://github.com/hotosm/fAIr/assets/97789856/dfec2ebe-8bf5-4a7a-832f-eed79b9c0b4b">


2.  Visualize Your Model's Prediction.Zoom to the area you want to see predictions and Click Detect to Run your Published training Model. It will load the model and Run live predictions.
<img width="1378" alt="1 2" src="https://github.com/hotosm/fAIr/assets/97789856/8641338a-5c85-47da-a99a-31797d2770a3">


3.  Bring Predictions to OSM.Your Predictions will be visualized on Map, Now you can bring them to OSM Modify them remove bad predictions and Push it back to OSM. fAIr should be able to have feedback loop when user discards the prediction or modifies it ( it is work in Prrogress) , you can launch JOSM with prediction data though.
<img width="1402" alt="1 3" src="https://github.com/hotosm/fAIr/assets/97789856/bbb570ab-ff78-4565-9679-b9a1b83e534b">


## Steps to make changes to the prediction of a particular model

1. Click on Start Mapping . Select a particular model to see it's prediction by running it's prediction.

2. Zoom in to the Area of Interest and accept or discard any part of the prdiction and again run prediction.

3. After making the changes you can click on "Submit my Feedback" button on the right pane.

4. All the feedbacks submitted need to be approved/validated by the project manager.


> Note: 'task' refers to each section of the map enclosed in the dotted
> lines and each task has a corresponding number tag.

 




## Help and Support
If you encounter any issues or need assistance while using FMTM, you can access the following resources:
- Check the [FAQs](https://github.com/hotosm/fAIr/blob/master/docs/FAQ.md) .
- Join our Slack channel.

## Thank you 
We are excited to have you join our community of passionate mappers and volunteers. fAIr is an AI powerful platform developed by the Humanitarian OpenStreetMap Team (HOT) that provides AI models and tools to automate mapping tasks, improving efficiency and accuracy.

With fAIr, you have the opportunity to make a real impact by mapping areas that are in need of support. Your contributions help create detailed and up-to-date maps that aid organizations and communities in their efforts to respond to crises, plan infrastructure, and improve the lives of people around the world.

By mapping with fAIr, you are joining a global community of dedicated individuals who share a common goal of using open data to make a positive difference. Together, we can create a more resilient and inclusive world.

Explore the projects, join tasks, and contribute your skills to help us build accurate and comprehensive maps. Don't hesitate to ask questions, seek guidance, and engage with fellow mappers through our forums and communication channels.

Thank you for being part of fAIr. Your mapping efforts are invaluable, and we appreciate your commitment to making a difference.

Happy mapping!

The fAIr Team

