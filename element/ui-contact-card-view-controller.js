'use strict'

const uiContactCardDoc = document._currentScript || document.currentScript;
const uiContactCardTemplate = uiContactCardDoc.ownerDocument.querySelector('#ui-contact-card-view');

class UIContactCard extends HTMLElement {

	static get observedAttributes(){
		return ['person', 'edit'];
	}

	constructor(model){
		super();
		this.model = model || {};
		//SET DEFAULTS, IF PERSON AND KNOWS DO NOT EXIST
		this.model.person = this.model.person || {};
		this.model.person.knows = this.model.person.knows || [];
		this.model.person.knows[0] = this.model.person.knows[0] || {};

		const view = document.importNode(uiContactCardTemplate.content, true);
		this.shadowRoot = this.attachShadow({mode: 'open'});
		this.shadowRoot.appendChild(view);

		this.state = {};
		this.state.connected = false;
		this.state.editing = false;

		this.SPACE_KEY = 32;
		this.spaceRegex = /\s+/g;
		this.digitRegex = /\d+/g;
		this.nonAlphabeticalRegex = /\W/g;
		this.alphabeticalRegex = /^[A-z]+$/;
		this.emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  	this.telephoneRegex = /^(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

		this.instantiatedOn = Date.now();

	}

	get shadowRoot(){return this._shadowRoot;}
	set shadowRoot(value){ this._shadowRoot = value}

	get connected(){ return this.state.connected; }
	set connected(value){ this.state.connected = value; }

	get visible(){ return this.state.visible; }
	set visible(value){
		//if the state already matches, return
		let display = value;
		let hide = !display;
		var type = null;

		let fade = (e) => {
			var step = type === 'in'? 0.05 : -0.05;
			var target = type === 'in'? 1 : 0;
			var current = parseFloat(this.$container.style.opacity);
			let progress = current + step;
			this.$container.style.opacity = progress;
			if(progress !== target){ requestAnimationFrame(fade) }
		}

		if(display){
			//set initial state
			this.$container.style.opacity = 0;
			type = 'in';
			fade();
		}
		else if(hide){
			//set initial state
			this.$container.style.opacity = 1;
			type = 'out';
			fade()
		}
	}

	get meta(){
		return this.person.meta || {
			createdOn: this.instantiatedOn
		}
	}
	set meta(value){
		this.person.meta = value;
	}

	get person(){ return this.model.person || {}; }
	set person(value){
		this.model.person = value || this.model.person || {};
		this.meta = this.model.person.meta;
		this.waitForConnection().then(connected => {
			if(this.editing){
				this._populateEditorFields();
				this._renderEditor();
			} else {
				this._populateViewFields();
				this._renderMainView();
			}
		})
	}

	get editing(){ return this.state.editing; }
	set editing(isEditing){
		this.state.editing = isEditing;
		let isNotEditing = !isEditing;
		if(isEditing){
			this.waitForConnection().then(connected => {
				this._clearEditorErrors();
				this._populateEditorFields();
				this._renderEditor(true);
				this._renderMainView(false);
			})
		}
	}

	get hasName(){
		return (this.givenName || this.familyName);
	}


	get givenName(){
		let givenName = null;
		if(this.person.givenName){
			givenName = this.person.givenName;
			givenName = givenName.charAt(0).toUpperCase() + givenName.slice(1);;
		}
		return givenName;
	}

	get familyName(){
		let familyName = null;
		if(this.person.familyName){
			familyName = this.person.familyName;
			familyName = familyName.charAt(0).toUpperCase() + familyName.slice(1);;
		}
		return familyName;
	}

	get fullName(){
		let fullName = null;
		if(this.givenName || this.familyName){
			fullName = `${this.givenName || ''} ${this.familyName || ''}`;
		}
		return fullName;
	}

	get updatedOn(){
		let result = null;
		if(this.meta.updatedOn){
			result = `Updated ${moment(this.meta.updatedOn).fromNow()}`;
		}
		return result;
	}

	set updatedOn(date){
		this.meta.updatedOn = date;
		this._renderTimer();
	}

	get createdOn(){
		let result = moment(this.meta.createdOn || this.meta.instantiatedOn).fromNow();
		result = `Created ${result}`;
		return result;
	}

	set createdOn(date){
		this.meta.createdOn = parseInt(date);
		this._renderTimer();
	}

	get telephone(){
		let telephone = null;
		if(this.person.telephone){
			telephone = this.formatTelephoneNumber(this.person.telephone);
		}
		return telephone;
	}

	get email(){
		let email = null;
		if(this.person.email){
			email = this.person.email.toLowerCase();
		}
		return email;
	}

	get hasEmergencyContact(){
		let result = false;
		if(this.person.knows && this.person.knows.length){
			let contact = this.person.knows[0];
			result = (contact.givenName || contact.familyName || contact.telephone);
		}
		return result;
	}

	get emergencyContact(){
		return this.person.knows[0];
	}

	get emergencyGivenName(){
		let givenName = null;
		if(this.hasEmergencyContact && this.emergencyContact.givenName){
			givenName = this.emergencyContact.givenName;
			givenName = givenName.charAt(0).toUpperCase() + givenName.slice(1);;
		}
		return givenName;
	}

	get emergencyFamilyName(){
		let familyName = null;
		if(this.hasEmergencyContact && this.emergencyContact.familyName){
			familyName = this.emergencyContact.familyName;
			familyName = familyName.charAt(0).toUpperCase() + familyName.slice(1);;
		}
		return familyName;
	}

	get emergencyFullName(){
		let fullName = null;
		if(this.emergencyGivenName || this.emergencyFamilyName){
			fullName = `${this.emergencyGivenName || ''} ${this.emergencyFamilyName || ''}`;
		}
		return fullName;
	}

	get emergencyTelephone(){
		let telephone = null;
		if(this.hasEmergencyContact && this.emergencyContact.telephone){
			telephone = this.formatTelephoneNumber(this.emergencyContact.telephone);
		}
		return telephone;
	}

	//ADD to template
	waitForConnection(){
		return new Promise((resolve, reject) => {
			let connected = this.state.connected;

			let checkConnection = () => {
				if(this.state.connected){
					clearInterval(checkConnection)
					resolve(true);
				} else {
					requestAnimationFrame(checkConnection);
				}
			}
			//Call immidiately
			checkConnection();
		})
	}

	//ViewDidLoad
	connectedCallback() {
		this._initViewReferences();
		this._initEventListeners();

		this._populateViewFields();
		this._populateEditorFields();

		this._renderEditor(this.editing);
		this._renderMainView(!this.editing);
		//Updates view minute
		this.liveRendering = setInterval(e => {
			this._renderTimer();
		}, 60000);
		this.connected = true;
	}

	attributeChangedCallback(attrName, oldVal, newVal) {
		switch(attrName){
			case 'person':
				this.person = JSON.parse(newVal);
				console.log(this.person)
				break;
			case 'edit':
				this.editing = (newVal == 'true');
				break;
			default:
				console.warn(`Attribute ${attrName} is not handled, you should probably do that`);
		}
	}

	_initViewReferences(){
		//VIEW
		this.$container = this.shadowRoot.querySelector('.container');
		this.$editButton = this.shadowRoot.querySelector('#editButton');
		this.$doneButton = this.shadowRoot.querySelector('#doneButton');
		this.$deleteButton = this.shadowRoot.querySelector('#deleteButton');
		this.$fullNameHeader = this.shadowRoot.querySelector('#fullNameHeader');
		this.$updatedOn = this.shadowRoot.querySelector('#updatedOn');
		this.$fullNameView = this.shadowRoot.querySelector('#fullNameView');
		this.$telephoneActionButton = this.shadowRoot.querySelector('#telephoneActionButton');
		this.$telephoneActionLabel = this.shadowRoot.querySelector('#telephoneActionLabel');
		this.$telephoneIcon = this.shadowRoot.querySelector('#telephoneIcon');
		this.$emailActionButton = this.shadowRoot.querySelector('#emailActionButton');
		this.$emailIcon = this.shadowRoot.querySelector('#emailIcon');
		this.$emailActionLabel = this.shadowRoot.querySelector('#emailActionLabel');
		this.$telephoneView = this.shadowRoot.querySelector('#telephoneView');
		this.$telephone = this.shadowRoot.querySelector('#telephone');
		this.$emailView = this.shadowRoot.querySelector('#emailView');
		this.$email = this.shadowRoot.querySelector('#email');
		this.$emailDivider = this.shadowRoot.querySelector('#emailDivider');
		this.$emergencyFullNameView = this.shadowRoot.querySelector('#emergencyFullNameView');
		this.$emergencyFullName = this.shadowRoot.querySelector('#emergencyFullName');
		this.$emergencyTelephoneView = this.shadowRoot.querySelector('#emergencyTelephoneView');
		this.$emergencyTelephone = this.shadowRoot.querySelector('#emergencyTelephone');
		this.$addEmergencyContactButton = this.shadowRoot.querySelector('#addEmergencyContactButton');
		//COMMON
		this.$dividers = this.shadowRoot.querySelectorAll('.info-divider');
		//EDIT
		this.$fullNameEdit = this.shadowRoot.querySelector('#fullNameEdit');
		this.$givenNameError = this.shadowRoot.querySelector('#givenNameError');
		this.$givenNameInput = this.shadowRoot.querySelector('#givenNameInput');
		this.$familyNameError = this.shadowRoot.querySelector('#familyNameError');
		this.$familyNameInput = this.shadowRoot.querySelector('#familyNameInput');
		this.$telephoneEdit = this.shadowRoot.querySelector('#telephoneEdit');
		this.$telephoneError = this.shadowRoot.querySelector('#telephoneError');
		this.$telephoneInput = this.shadowRoot.querySelector('#telephoneInput');
		this.$emailEdit = this.shadowRoot.querySelector('#emailEdit');
		this.$emailError = this.shadowRoot.querySelector('#emailError');
		this.$emailInput = this.shadowRoot.querySelector('#emailInput');
		this.$emergencyFullNameEdit = this.shadowRoot.querySelector('#emergencyFullNameEdit');
		this.$emergencyGivenNameError = this.shadowRoot.querySelector('#emergencyGivenNameError');
		this.$emergencyGivenNameInput = this.shadowRoot.querySelector('#emergencyGivenNameInput');
		this.$emergencyFamilyNameError = this.shadowRoot.querySelector('#emergencyFamilyNameError');
		this.$emergencyFamilyNameInput = this.shadowRoot.querySelector('#emergencyFamilyNameInput');
		this.$emergencyTelephoneEdit = this.shadowRoot.querySelector('#emergencyTelephoneEdit');
		this.$emergencyTelephoneError = this.shadowRoot.querySelector('#emergencyTelephoneError');
		this.$emergencyTelephoneInput = this.shadowRoot.querySelector('#emergencyTelephoneInput');
	}

	_initEventListeners(){
		//EVENTS
		this.$editButton.addEventListener('click', this.edit.bind(this))
		this.$deleteButton.addEventListener('click', this.delete.bind(this))
		this.$doneButton.addEventListener('click', this.done.bind(this))

  	this.$givenNameInput.addEventListener('keyup', (e) => this.updateName(e, this.person, 'givenName', this.$givenNameError) );
  	this.$givenNameInput.addEventListener('focusout', (e) => this.updateName(e, this.person, 'givenName', this.$givenNameError) );
  	this.$familyNameInput.addEventListener('keyup', (e) => this.updateName(e, this.person, 'familyName', this.$familyNameError) );
  	this.$familyNameInput.addEventListener('focusout', (e) => this.updateName(e, this.person, 'familyName', this.$familyNameError) );
		this.$emailInput.addEventListener('keyup', (e) => this.updateEmail(e, this.person, 'email', this.$emailError) );
		this.$emailInput.addEventListener('focusout', (e) => this.updateEmail(e, this.person, 'email', this.$emailError) );
		this.$telephoneInput.addEventListener('input', (e) => this.updateTelephone(e, this.person, 'telephone', this.$telephoneError) );
		this.$telephoneInput.addEventListener('focusout', (e) => this.updateTelephone(e, this.person, 'telephone', this.$telephoneError) );

  	this.$emergencyGivenNameInput.addEventListener('keyup', (e) => this.updateName(e, this.emergencyContact, 'givenName', this.$emergencyGivenNameError) );
  	this.$emergencyGivenNameInput.addEventListener('focusout', (e) => this.updateName(e, this.emergencyContact, 'givenName', this.$emergencyGivenNameError) );
  	this.$emergencyFamilyNameInput.addEventListener('keyup', (e) => this.updateName(e, this.emergencyContact, 'familyName', this.$emergencyFamilyNameError) );
  	this.$emergencyFamilyNameInput.addEventListener('focusout', (e) => this.updateName(e, this.emergencyContact, 'familyName', this.$emergencyFamilyNameError) );
		this.$emergencyTelephoneInput.addEventListener('input', (e) => this.updateTelephone(e, this.emergencyContact, 'telephone', this.$emergencyTelephoneError) );
		this.$emergencyTelephoneInput.addEventListener('focusout', (e) => this.updateTelephone(e, this.emergencyContact, 'telephone', this.$emergencyTelephoneError) );

		this.$emailActionButton.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(notEditing){
				e.email = this.email;
				this._email(e);
			}
			else { this._renderEditor(); }
		});

		this.$email.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(notEditing){
				e.email = this.email;
				this._email(e);
			}
		});

		this.$telephoneActionButton.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(notEditing){
				e.telephone = this.person.telephone;
				this._call(e);
			}
			else { this._renderEditor(); }
		});

		this.$fullNameView.addEventListener('click', e => {
			this.editing = true;
			this.$givenNameInput.focus();
		})

		this.$telephone.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(notEditing){
				e.telephone = this.person.telephone;
				this._call(e);
			}
		});

		this.$addEmergencyContactButton.addEventListener('click', e => {
			this.editing = true;
			this.$emergencyGivenNameInput.focus();
		});


		this.$emergencyTelephone.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(this.hasEmergencyContact && notEditing ){
				e.telephone = this.person.knows[0].telephone;
				this._call(e);
			}
		});

	}

	_renderTimer(){
		this.$updatedOn.innerHTML = this.updatedOn || this.createdOn;;
	}

	_populateViewFields(){
		this.$fullNameHeader.innerHTML = this.fullName || "New Contact";
		this.$updatedOn.innerHTML = this.updatedOn || this.createdOn;;
		this.$email.innerHTML = this.email || 'add email';
		this.$telephone.innerHTML = this.telephone || 'add number';

		//EMERGENCY CONTACT
		if(this.hasEmergencyContact){
			this.$addEmergencyContactButton.classList.add('hide-view');
			this.$emergencyFullName.classList.remove('hide-view');
			this.$emergencyTelephone.classList.remove('hide-view');
			this.$emergencyFullName.innerHTML = this.emergencyFullName || '';
			this.$emergencyTelephone.innerHTML = this.emergencyTelephone || 'add number';
		} else {
			this.$addEmergencyContactButton.classList.remove('hide-view');
			this.$emergencyTelephone.classList.add('hide-view');
			this.$emergencyFullName.classList.add('hide-view');
			//No emergency contact, add one
		}
	}

	//CHANGE SHOW VAR NAME, IT"S CONFUSING
	_renderEditor(show=true){
		let activeHeader = show? 'active-header' : 'inactive-header';
		let inactiveHeader = show? 'inactive-header' : 'active-header';
		this.$fullNameHeader.classList.add(inactiveHeader);
		this.$fullNameHeader.classList.remove(activeHeader);

		let activeBorder = show? 'active-border' : 'inactive-border';
		let inactiveBorder = show? 'inactive-border' : 'active-border';
		let activeText = show? 'active-text' : 'inactive-text';
		let inactiveText = show? 'inactive-text' : 'active-text';
		let activeBackground = show? 'active-background' : 'inactive-background';
		let inactiveBackground = show? 'inactive-background' : 'active-background';
		this.$telephoneActionButton.classList.add(inactiveBackground);
		this.$telephoneActionButton.classList.remove(activeBackground);
		this.$telephoneActionLabel.classList.add(inactiveText);
		this.$telephoneActionLabel.classList.remove(activeText);
		this.$emailActionButton.classList.add(inactiveBackground);
		this.$emailActionButton.classList.remove(activeBackground);
		this.$emailActionLabel.classList.add(inactiveText);
		this.$emailActionLabel.classList.remove(activeText);
		this.$dividers.forEach( $divider => {
			$divider.classList.add(activeBorder);
			$divider.classList.remove(inactiveBorder);
		})

		//Show or hide views
		let addClass = show? 'show-view' : 'hide-view';
		let removeClass = show? 'hide-view' : 'show-view';
		this.$fullNameEdit.classList.add(addClass);
		this.$fullNameEdit.classList.remove(removeClass);
		this.$telephoneEdit.classList.add(addClass);
		this.$telephoneEdit.classList.remove(removeClass);
		this.$emailEdit.classList.add(addClass);
		this.$emailEdit.classList.remove(removeClass);
		this.$emergencyFullNameEdit.classList.add(addClass);
		this.$emergencyFullNameEdit.classList.remove(removeClass);
		this.$emergencyTelephoneEdit.classList.add(addClass);
		this.$emergencyTelephoneEdit.classList.remove(removeClass);
		this.$doneButton.classList.add(addClass);
		this.$doneButton.classList.remove(removeClass);
		this.$deleteButton.classList.add(addClass);
		this.$deleteButton.classList.remove(removeClass);
		//Hidden (removes from layout)
		this.$addEmergencyContactButton.hidden = show;

		this.$fullNameView.classList.remove('show-view');
		this.$fullNameView.classList.add('hide-view');
	}

	_populateEditorFields(){
		this.$fullNameHeader.innerHTML = this.hasName? this.fullName : 'New Contact';
		this.$givenNameInput.value = this.givenName || '';
		this.$familyNameInput.value = this.familyName || '';
		this.$telephoneInput.value = this.telephone || '';
		this.$emailInput.value = this.email || '';
		if(this.hasEmergencyContact){
			this.$emergencyGivenNameInput.value = this.emergencyGivenName || '';
			this.$emergencyFamilyNameInput.value = this.emergencyFamilyName || '';
			this.$emergencyTelephoneInput.value = this.emergencyTelephone || '';
		}
	}

	_clearEditorErrors(){
		this.$telephoneInput.classList.remove('error-input');
	}

	_renderMainView(show=true){
		//If show is true, add class is show-view
		let addClass = show? 'show-view' : 'hide-view';
		//If show is false, add class is hide-view
		let removeClass = show? 'hide-view' : 'show-view';
		this.$telephoneView.classList.add(addClass);
		this.$telephoneView.classList.remove(removeClass);
		this.$emailView.classList.add(addClass);
		this.$emailView.classList.remove(removeClass);
		this.$emergencyFullNameView.classList.add(addClass);
		this.$emergencyFullNameView.classList.remove(removeClass);
		this.$emergencyTelephoneView.classList.add(addClass);
		this.$emergencyTelephoneView.classList.remove(removeClass);
		this.$editButton.classList.add(addClass);
		this.$editButton.classList.remove(removeClass);

		if(this.hasName){
			this.$fullNameView.classList.add('hide-view');
			this.$fullNameView.classList.remove('show-view');
		}
		//No name contact
		else {
			this.$fullNameView.classList.add('show-view');
			this.$fullNameView.classList.remove('hide-view');
		}
	}

	_emitEvent(event='update'){
		let data = {};
		data.meta = this.meta;
		data.model = this.model;
		data.state = this.state;
		this.dispatchEvent(new CustomEvent(event, {detail: data}));
	}

	//Removes the card from view, and disconnects element from DOM
	delete(e){
		this._emitEvent('delete');
	}

	done(e){
		this.editing = false;
		this._populateViewFields();
		this._renderMainView(true);
		this._renderEditor(false);
		this._emitEvent('update');
	}

	edit(e){
		this.editing = true;
		this._populateEditorFields();
		this._renderEditor(true);
		this._renderMainView(false);
	}

	clear(){
		this.$fullNameHeader.innerHTML = 'New Contact';
		this.$givenNameInput.value = '';
		this.$familyNameInput.value = '';
		this.$telephoneInput.value = '';
		this.$emailInput.value = '';
		this.$emergencyGivenNameInput.value = '';
		this.$emergencyFamilyNameInput.value = '';
		this.$emergencyTelephoneInput.value = '';
		this.person = {};

	}

	_call(e){
		if(e.telephone && !this.editing){
			window.location.href = `tel:${e.telephone}`;
			this.$telephoneIcon.classList.remove("fa-phone","fa-2x");
			this.$telephoneIcon.classList.add("fa-circle-o-notch","fa-spin");
			let animationDuration = 3000;
			let timer = setTimeout(e => {
				this.$telephoneIcon.classList.remove("fa-circle-o-notch","fa-spin");
				this.$telephoneIcon.classList.add("fa","fa-phone","fa-2x");
				clearTimeout(timer);
			}, animationDuration);
		}
		else if(!e.telephone){
			this.editing = true;
			this.$telephoneInput.focus();
		}
	}

	_email(e){
		if(e.email && !this.editing){
			window.location.href = `mailto:${this.email}`;
			let animationDuration = 3000;
			this.$emailIcon.classList.remove("fa-envelope");
			this.$emailIcon.classList.add("fa-circle-o-notch","fa-spin");
			let timer = setTimeout(e => {
				this.$emailIcon.classList.remove("fa-circle-o-notch","fa-spin");
				this.$emailIcon.classList.add("fa-envelope");
				clearTimeout(timer);
			}, animationDuration);
		}
		else if (!e.email){
			this.editing = true;
			this.$emailInput.focus();
		}
	}

	disconnectedCallback() {
		this.connected = false;
		clearInterval(this.liveRendering);
		//TODO: Remove DOM References, events, etc
		//this.$editButton.removeEventListener('click', this.edit.bind(this))
		console.log('disconnectedCallback')
	}

  updateName(e, person, property, $error){
    var keyCode = e.which || e.keyCode || e.keyIdentifier || 0;
    let isAlphabetical = this.alphabeticalRegex.test(e.key);
    let isNotAlphabetical = isAlphabetical;
    let isNotSpace = (keyCode !== this.SPACE_KEY);
    let isNotBlank = e.target.value && e.target.value !== "";
    let lostFocus = e.type === 'focusout';
    let isBlank = !isNotBlank;
    let isSpace = !isNotSpace;
    let isValid = (isNotBlank && isNotSpace && isAlphabetical);
    let personHasProperty = person[property];
    let personDoesNotHaveProperty = !personHasProperty;
    let value = e.target.value;


    if(isValid){
      value = value.charAt(0).toUpperCase() + value.slice(1);;
      e.target.value = value;
      $error.innerHTML = '';
			person[property] = value;
			this.updatedOn = Date.now();
    } else if(isSpace){
      value = value.replace(this.spaceRegex, '');
      e.target.value = value;
      $error.innerHTML = 'cannot contain spaces';
    } else if(!isAlphabetical){
      $error.innerHTML = 'cannot contain numbers, or special characters';
      value = value.replace(this.digitRegex, '')
      value = value.replace(this.nonAlphabeticalRegex, '')
      e.target.value = value;
    } else if(isBlank && lostFocus && personHasProperty){
      $error.innerHTML = 'cannot be blank, used last known name instead';
      e.target.value = person[property];
    }

  }

  updateEmail(e, person, property, $error){
		e.target.classList.remove('error-input');
    var keyCode = e.which || e.keyCode || e.keyIdentifier || 0;
    var isNotSpace = (keyCode !== this.SPACE_KEY);
    var isSpace = !isNotSpace;
    var isNotBlank = e.target.value && e.target.value !== "";
    var isBlank = !isNotBlank;
    var lostFocus = e.type === 'focusout';

    let isValid = isNotSpace;
    let personHasProperty = person[property];
    let personDoesNotHaveProperty = !personHasProperty;
    let value = e.target.value;
    $error.innerHTML = '';
		e.target.classList.remove('error-input');

    if(isValid){
      let isEmail = this.emailRegex.test(value);
      let isNotEmail = !isEmail;
      if(isNotEmail && isNotBlank && lostFocus){
        $error.innerHTML = 'must be valid (e.g., your@email.com)';
				this.$emailDivider.classList.add('error-border')
				e.target.classList.add('error-input');
      } else if(isBlank){
        $error.innerHTML = '';
				e.target.classList.remove('error-input');
				this.$emailDivider.classList.remove('error-border')
      } else if(isEmail && lostFocus){
        $error.innerHTML = '';
				e.target.classList.remove('error-input');
				this.$emailDivider.classList.remove('error-border')
				person[property] = e.target.value;
				this.updatedOn = Date.now();
      }
		}
		else if(isSpace){
      value = value.replace(this.spaceRegex, '');
      e.target.value = value;
      $error.innerHTML = 'cannot contain spaces';
    }

  }

  formatTelephoneNumber(s){
      var s2 = (""+s).replace(/\D/g, '');
      var m1 = s2.match(/^(\d{1})$/);
      var m2 = s2.match(/^(\d{2})$/);
      var m3 = s2.match(/^(\d{3})$/);
      var m4 = s2.match(/^(\d{3})(\d{1})$/);
      var m5 = s2.match(/^(\d{3})(\d{2})$/);
      var m6 = s2.match(/^(\d{3})(\d{3})$/);
      var m7 = s2.match(/^(\d{3})(\d{3})(\d{1})$/);
      var m8 = s2.match(/^(\d{3})(\d{3})(\d{2})$/);
      var m9 = s2.match(/^(\d{3})(\d{3})(\d{3})$/);
      var m10 = s2.match(/^(\d{3})(\d{3})(\d{4})$/);

      let finalFormat = "";
      finalFormat = m1? `(${m1[1]}) - ` : finalFormat;
      finalFormat = m2? `(${m2[1]}) - ` : finalFormat;
      finalFormat = m3? `(${m3[1]}) - ` : finalFormat;
      finalFormat = m4? `(${m4[1]}) ${m4[2]}- ` : finalFormat;
      finalFormat = m5? `(${m5[1]}) ${m5[2]}- ` : finalFormat;
      finalFormat = m6? `(${m6[1]}) ${m6[2]}- ` : finalFormat;
      finalFormat = m7? `(${m7[1]}) ${m7[2]}-${m7[3]}` : finalFormat;
      finalFormat = m8? `(${m8[1]}) ${m8[2]}-${m8[3]}` : finalFormat;
      finalFormat = m9? `(${m9[1]}) ${m9[2]}-${m9[3]}` : finalFormat;
      finalFormat = m10? `(${m10[1]}) ${m10[2]}-${m10[3]}` : finalFormat;
      return finalFormat;
  }


  updateTelephone(e, person, property, $error){

		e.target.classList.remove('error-input');
		var telephone = e.target.value.replace(/\D/g, '');
		e.target.value = this.formatTelephoneNumber(e.target.value)
		let numDigits = telephone.length;
		numDigits += numDigits >= 6? 4 : 0;
		numDigits += numDigits >= 3 && numDigits < 6? 3 : 0;
		numDigits += numDigits < 3? 1 : 0;
		e.target.setSelectionRange(numDigits,numDigits)
		var isBlank = (e.target.value === '' || e.target.value === null || typeof e.target.value === 'undefined');
		var isNotBlank = !isBlank;
		var isValid = this.telephoneRegex.test(e.target.value);
		var isNotValid = !isValid;
		var lostFocus = e.type === 'focusout';


    if(e.inputType !== 'deleteContentBackward'){
      if(isValid){
				console.log('VALID', telephone )
        $error.innerHTML = '';
        e.target.classList.remove('error-input');
				person.telephone = telephone;
				this.updatedOn = Date.now();
			}
			if(lostFocus && isValid){
				console.log('BLUR VALID')
				person.telephone = telephone;
				this.updatedOn = Date.now();
			}
			if(isNotValid && isNotBlank && lostFocus) {
				console.log('INVALID, BLANK, BLUR')
        e.target.classList.add('error-input');
				$error.innerHTML = 'must be ten digits long: (555) 555-5555';
			}
			if(isNotValid && lostFocus) {
				console.log('INVALID, BLUR')
        e.target.classList.add('error-input');
				$error.innerHTML = 'must be ten digits long: (555) 555-5555';
			}

    }
    //DELETING
    else {
			console.log('INVALID', telephone)
      let value = e.target.value;
      let lastIndex = value.length - 1;
      let nextChar = value.charAt(lastIndex)
      let secondToLastChar = value.charAt(lastIndex-1)
      if(nextChar === '-'){
        e.target.value = value.substring(0, lastIndex);
      }else if(nextChar === ' '){
        e.target.value = value.substring(0, lastIndex);
        e.target.setSelectionRange(lastIndex-1,lastIndex-1)
      }else if(secondToLastChar === '('){
        e.target.value = '';
      }
    }
  }

}

window.customElements.define('ui-contact-card', UIContactCard);
