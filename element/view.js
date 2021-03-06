const view = document.createElement("template");
view.innerHTML = `

    <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" />
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.6.3/css/all.css" />

    <style>
        * {
            font-family: 'Roboto', sans-serif;
        }

        .host {
            box-sizing:border-box;
            padding:0px;
            margin:0px;
        }

        .container {
            box-sizing:border-box;
            border:1px solid #d7d8e1;
            opacity:1;
        }

        .header {
            border-bottom:1px solid #f3f3f5;
            background-color:#fbfaff;
            padding-bottom:66px;
            padding-right:11px;
            padding-left:11px;
            position:relative;
            padding-top:33px;
            cursor:default;
            width:100%;
        }

        .done-button {
            background-color:transparent;
            position:absolute;
            text-align:center;
            font-size:1.2em;
            cursor:pointer;
            color:#1c7ef8;
            border:none;
            height:66px;
            width:66px;
            right:11px;
            top:11px;
        }

        .edit-button {
            background-color:transparent;
            position:absolute;
            text-align:center;
            font-size:1.2em;
            cursor:pointer;
            color:#1c7ef8;
            border:none;
            height:66px;
            width:66px;
            right:11px;
            top:11px;
        }

        .delete-button {
            background-color:transparent;
            position:absolute;
            text-align:center;
            font-size:1.2em;
            cursor:pointer;
            color:#fc3d39;
            border:none;
            height:66px;
            width:66px;
            left:16px;
            top:11px;
        }


        .full-name {
            vertical-align:middle;
            margin-bottom:10px;
            margin-top:44px;
            text-align:center;
            line-height:1em;
            font-size:3em;
            width:100%;
        }

        .last-updated {
            text-align:center;
            font-weight:300;
            font-size:1.2em;
            color:#808080;
        }

        .action-container {
            justify-content: center;
            display: flex;
        }

        .action-button {
            background-color:#1c7ef8;
            border-radius:30px;
            margin-bottom:11px;
            margin-right:20px;
            margin-left:20px;
            margin-top:22px;
            cursor:pointer;
            height:60px;
            width:60px;
        }

        .danger-action {
            background-color:#fc3d39;
        }

        .danger-label {
            color:#fc3d39 !important;
        }

        .action-icon {
            vertical-align:middle;
            text-align:center;
            line-height:60px;;
            font-size:30px;
            color:white;
            height:60px;
            width:60px;
        }

        .action-label {
            text-align:center;
            font-size:1em;
            margin-top:10px;
            cursor:default;
            color:#1c7ef8;
        }

        .info-container {
            background-color:white;
            cursor:default;
            padding:44px;
            width:100%;
        }

        .info-label {
            display:inline;
            font-size:1.3em;
        }

        .error-label {
            color:#808080;
        }

        .error-input {
            color:#fc3d39 !important;
        }


        .info-value {
            padding-bottom:22px;
            margin-bottom:11px;
            padding-top:22px;
            font-size:1.5em;
            cursor:pointer;
            color:#1c7ef8;
        }

        .editing {
            color:#808080;
        }

        input {
            margin-bottom:0px !important;
            color:black !important;
            text-indent:10px;
            border:none;
            width:100%;
        }

        .info-divider {
            border: 1px solid #f3f3f5;
            margin-bottom:44px;
        }

        .active-border {
            border: 1px solid #1c7ef8;
            cursor:pointer;
        }
        .inactive-border {
            border: 1px solid #f3f3f5;
            cursor:default;
        }
        .error-border {
            border: 1px solid #fc3d39;
            cursor:default;
        }



        .active-header {
            color: black;
            cursor:default;
        }
        .inactive-header {
            color: #808080;
            cursor:default;
        }
        .active-text {
            color: #1c7ef8;
            cursor:pointer;
        }
        .inactive-text {
            color: #808080;
            cursor:default;
        }
        .active-background {
            background-color: #1c7ef8;
            cursor:pointer;
        }
        .inactive-background {
            background-color: #808080;
            cursor:default;
        }


        .emergency-header-text {
            font-size:1.4em;
            color:lightGray;
            margin-top:44px;
            margin-bottom:22px;
        }

        .emergency-contact-value {
            padding-bottom:22px;
            padding-top:22px;
            font-size:1.5em;
            cursor:pointer;
            color:#fc3d39;
        }

        .hide-view {
            display:none;
        }

        .show-view {
            display:initial;
        }

    </style>


    <div class="host container">

        <!--------------------- HEADER  ---------------------------->

        <div class="host header">
            <!--Edit button-->
            <button id="deleteButton" class="host delete-button">Delete</button>
            <button id="doneButton" class="host done-button">Done</button>
            <button id="editButton" class="host edit-button">Edit</button>
            <!--Fullname-->
            <h1 id="fullNameHeader" class="host full-name">&nbsp;</h1>
            <p id="updatedOn" class="host last-updated">&nbsp;</p>
            <!--Tap Actions-->
            <div class="host action-container">
                <!--<div id="deleteActionButton" class="host action-button danger-action">-->
                    <!--<span id="deleteIcon" class="host action-icon fa fa-trash fa-2x"></span>-->
                    <!--<p id="deleteActionLabel" class="host action-label danger-label">delete</p>-->
                    <!--</div> [>Delete Action<]-->
                <div id="telephoneActionButton" class="host action-button">
                    <i id="telephoneIcon" class="host action-icon fas fa-phone fa-2x action-icon"></i>
                    <p id="telephoneActionLabel" class="host action-label">phone</p>
                </div> <!--Telephone Action-->
                <div id="emailActionButton" class="host action-button">
                    <span id="emailIcon" class="host action-icon fas fa-envelope fa-2x"></span>
                    <p id="emailActionLabel" class="host action-label">email</p>
                </div> <!--Email Action-->
            </div> <!--Tap Actions-->
        </div> <!--HEADER-->


        <!---------------------------- DETAILS  --------------------------------->

        <!--DETAILS-->
        <div id="contactInfoContainer" class="host info-container">
            <form action="/person/create" method="POST">
                <input id="csrfToken" type="hidden" name="_csrf">

                <!--------------------- CONTACT INFO  ---------------------------->
                <div id="addName">
                    <p class="host info-label">name</p>
                    <p id="fullName" class="host info-value">add name</p>
                    <div class="host info-divider"></div>
                </div> <!--VIEW-->

                <!--FULLNAME EDIT-->
                <div id="fullNameEdit">
                    <!--EDIT-->
                    <div id="givenNameEdit">
                        <p class="host info-label editing">first name &nbsp;</p>
                        <p id="givenNameError" class="info-label error-label"></p>
                        <input name="givenName" id="givenNameInput" placeholder="given name (e.g., Jane)" class="host info-value"/>
                        <div class="host info-divider"></div>
                    </div> <!--EDIT-->
                    <!--EDIT-->
                    <div id="familyNameEdit">
                        <p class="host info-label editing">last name &nbsp;</p>
                        <p id="familyNameError" class="info-label error-label"></p>
                        <input name="familyName" id="familyNameInput" placeholder="family name (e.g., Smith)" class="host info-value"/>
                        <div class="host info-divider"></div>
                    </div> <!--EDIT-->
                </div> <!--FULLNAME-->

                <!--TELEPHONE-->
                <div id="telephoneSection">
                    <!--VIEW-->
                    <div id="telephoneView">
                        <p class="host info-label">phone</p>
                        <p id="telephone" class="host info-value">&nbsp;</p>
                        <div class="host info-divider"></div>
                    </div> <!--VIEW-->
                    <!--EDIT-->
                    <div id="telephoneEdit">
                        <p class="host info-label editing">phone &nbsp;</p>
                        <p id="telephoneError" class="info-label error-label"></p>
                        <input name="telephone" id="telephoneInput" placeholder="(555) 555-5555" class="host info-value"/>
                        <div class="host info-divider"></div>
                    </div> <!--EDIT-->
                </div> <!--TELEPHONE-->

                <!--EMAIL-->
                <div id="emailSection">
                    <!--VIEW-->
                    <div id="emailView">
                        <p class="host info-label">email</p>
                        <p id="email" class="host info-value">&nbsp;</p>
                        <div class="host info-divider"></div>
                    </div> <!--VIEW-->
                    <!--EDIT-->
                    <div id="emailEdit">
                        <p class="host info-label editing">email &nbsp;</p>
                        <p id="emailError" class="info-label error-label"></p>
                        <input name="email" id="emailInput" placeholder="email@email.com" class="host info-value"/>
                        <div id="emailDivider" class="host info-divider"></div>
                    </div> <!--EDIT-->
                </div><!--EMAIL-->


                <!--------------------- EMERGENCY ---------------------------->

                <div id="emergencyContainer">
                    <!--Header-->
                    <div id="emergencyHeader">
                        <p class="host emergency-header-text">Emergency Contact</p>
                    </div> <!--Header-->

                    <!--Add Button-->
                    <p id="addEmergencyContactButton" class="host info-value">add contact</p>

                    <!--FULL NAME-->
                    <div id="emergencyFullNameContainer">
                        <!--VIEW-->
                        <div id="emergencyFullNameView">
                            <p id="emergencyFullName" class="host info-label">&nbsp;</p>
                        </div> <!--VIEW-->
                        <!--EDIT-->
                        <div id="emergencyFullNameEdit">
                            <!--Given Name-->
                            <div>
                                <p class="host info-label editing">first name &nbsp;</p>
                                <p id="emergencyGivenNameError" class="info-label error-label"></p>
                                <input name="emergencyGivenName" id="emergencyGivenNameInput" placeholder="given name (e.g., John)" class="host info-value"/>
                                <div class="host info-divider"></div>
                            </div> <!--Given Name-->
                            <!--Last Name-->
                            <div>
                                <p class="host info-label editing">last name &nbsp;</p>
                                <p id="emergencyFamilyNameError" class="info-label error-label"></p>
                                <input name="emergencyFamilyName" id="emergencyFamilyNameInput" placeholder="family name (e.g., Doe)" class="host info-value"/>
                                <div class="host info-divider"></div>
                            </div><!--Last Name-->
                        </div> <!--EDIT-->

                    </div> <!--FULL NAME-->

                    <!--TELEPHONE-->
                    <div>
                        <!--VIEW-->
                        <div id="emergencyTelephoneView">
                            <p id="emergencyTelephone" class="host emergency-contact-value">&nbsp;</p>
                        </div> <!--VIEW-->
                        <!--EDIT-->
                        <div id="emergencyTelephoneEdit">
                            <p class="host info-label editing">phone &nbsp;</p>
                            <p id="emergencyTelephoneError" class="info-label error-label"></p>
                            <input name="emergencyTelephone" id="emergencyTelephoneInput" placeholder="(555) 555-5555" class="host info-value"/>
                            <div class="host info-divider"></div>
                        </div> <!--EDIT-->
                    </div> <!--TELEPHONE-->

                </div> <!--EMERGENCY CONTACT-->
            </form> <!--FORM END-->
        </div> <!--DETAILS CONTAINER-->
    </div> <!--CARD CONTAINER-->
`;

export default view;
