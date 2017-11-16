'use strict'

const uiContactCardDoc = document._currentScript || document.currentScript;
const uiContactCardTemplate = uiContactCardDoc.ownerDocument.querySelector('#ui-contact-card-view');

class UIContactCard extends HTMLElement {

  static get observedAttributes(){
    return ['person', 'edit'];
  }

  constructor(model){
    super();
    this.state = {};
    this.model = model || {};
    const view = document.importNode(uiContactCardTemplate.content, true);
    this.shadowRoot = this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(view);
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

  get person(){ return this.model.person || {}; }
  set person(value){
    this.model.person = value;
    this._emitEvent('update');
		this._populateViewFields();
  }

	get editing(){ return this.state.editing; }
	set editing(isEditing){
	  this.state.editing = isEditing;
		let isNotEditing = !isEditing;
		this._displayMainView(isNotEditing);
		this._displayEditor(isEditing);
		this._populateEditorFields();
    this._emitEvent('edit');
	}

	get hasEmergencyContact(){
		return (this.person.knows && this.person.knows.length);
	}

	get hasName(){
		return (this.person.givenName || this.person.familyName);
	}

	get fullName(){
			return `${this.person.givenName || ''} ${this.person.familyName || ''}`;
	}


	get emergencyContact(){
		let hasEmergencyContact = this.person.knows && this.person.knows.length;
		return hasEmergencyContact? this.person.knows[0] : {};
	}

	//ViewDidLoad
  connectedCallback() {
    this.state.connected = true;
		this._initViewReferences();
		this._initEventListeners();
		this._initRender();
  }

  attributeChangedCallback(attrName, oldVal, newVal) {
    switch(attrName){
      case 'person':
        this.person = JSON.parse(newVal);
        break;
    case 'edit':
        this.editing = (newVal == 'true');
        break;
      default:
        console.warn(`Attribute ${attrName} is not handled, you should probably do that`);
    }
  }

  disconnectedCallback() {
		//TODO: Remove DOM References, events, etc
    this.connected = false;
  }

	_initState(){
    this.connected = false;
    this.editing = false;
		this.visible = false;
	}

	_initViewReferences(){
    //VIEW
    this.$container = this.shadowRoot.querySelector('.container');
    this.$editButton = this.shadowRoot.querySelector('#editButton');
    this.$doneButton = this.shadowRoot.querySelector('#doneButton');
    this.$deleteButton = this.shadowRoot.querySelector('#deleteButton');
    this.$fullName = this.shadowRoot.querySelector('#fullName');
    this.$lastUpdated = this.shadowRoot.querySelector('#lastUpdated');
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

		this.$addEmergencyContactButton.addEventListener('click', e => {
			this.editing = true;
			this.$emergencyGivenNameInput.focus();
		});

		this.$emailActionButton.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(notEditing){
				e.email = this.person.email;
				this._email(e);
			}
		});

		this.$email.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(notEditing){
				e.email = this.person.email;
				this._email(e);
			}
		});

    this.$telephoneActionButton.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(notEditing){
				e.telephone = this.person.telephone;
				this._call(e);
			}
    });

		this.$telephone.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(notEditing){
				e.telephone = this.person.telephone;
				this._call(e);
			}
		});

		this.$emergencyTelephone.addEventListener('click', e => {
			let notEditing = !this.editing;
			if(this.hasEmergencyContact && notEditing ){
				e.telephone = this.person.knows[0].telephone;
      	this._call(e);
			}
		});
	}

	_initRender(){
		this._displayEditor(false);
		this._displayMainView(true);
		this._populateViewFields();
		this.visible = true;
	}

	_populateViewFields(){

		this.$fullName.innerHTML = this.fullName || "New Contactc";
		this.$lastUpdated.innerHTML = 'Statically updated';
		this.$email.innerHTML = this.person.email || 'add email';
		this.$telephone.innerHTML = this.person.telephone || 'add number';

		//EMERGENCY CONTACT
		if(this.hasEmergencyContact){
			this.$addEmergencyContactButton.hidden = true;;
			//this.$addEmergencyContactButton.classList.add('hide-view');
			//this.$addEmergencyContactButton.classList.remove('show-view');
			let name = `${this.emergencyContact.givenName || ''} ${this.emergencyContact.familyName || ''}`;
			this.$emergencyFullName.innerHTML = name;
			if(this.emergencyContact.telephone){
				this.$emergencyTelephone.innerHTML = this.emergencyContact.telephone;
			} else{
				let hasName = this.emergencyContact.givenName || this.emergencyContact.fullName;
				this.$emergencyTelephone.innerHTML = hasName? 'add number' : 'add contact';
				this.$addEmergencyContactButton.addEventListener('click', e => {
					console.log('CLICKED', e)
					this.editing = true;
					hasName? this.$emergencyTelephoneInput.focus() : this.$emergencyGivenName.focus();
				})
				this.$emergencyTelephone.style.color = '#1c7ef8';
			}
		} else {
			//No emergency contact, add one
			this.$addEmergencyContactButton.hidden = false;;
			//this.$addEmergencyContactButton.classList.add('show-view');
			//this.$addEmergencyContactButton.classList.remove('hide-view');
		}
	}

	//CHANGE SHOW VAR NAME, IT"S CONFUSING
	_displayEditor(show){

		let activeHeader = show? 'active-header' : 'inactive-header';
		let inactiveHeader = show? 'inactive-header' : 'active-header';
		this.$fullName.classList.add(inactiveHeader);
		this.$fullName.classList.remove(activeHeader);

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
		this.$addEmergencyContactButton.hidden = show;;
	}

	_populateEditorFields(){
		this.$givenNameInput.value = this.person.givenName || '';
		this.$familyNameInput.value = this.person.familyName || '';
		this.$telephoneInput.value = this.person.telephone || '';
		this.$emailInput.value = this.person.email || '';
		if(this.hasEmergencyContact){
			let emergencyContact = this.person.knows[0];
			this.$emergencyGivenNameInput.value = emergencyContact.givenName || '';
			this.$emergencyFamilyNameInput.value = emergencyContact.familyName || '';
			this.$emergencyTelephoneInput.value = emergencyContact.telephone || '';
		}
	}

	_displayMainView(show){
		//If show is true, add class is show-view
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
	}

  _emitEvent(event='update'){
		let data = {};
		data.model = this.model;
		data.state = this.state;
    this.dispatchEvent(new CustomEvent(event, {detail: data}));
  }

	delete(e){
		this.visible = false;
		this.editing = false;
	}

	done(e){
		this.editing = false;
	}

	edit(e){
		this.editing = true;
	}

  _call(e){
		if(e.telephone && !this.editing){
    	let delay = 3000;
    	this.$telephoneIcon.classList.remove("fa","fa-phone","fa-2x");
    	this.$telephoneIcon.classList.add("fa","fa-circle-o-notch","fa-spin","fa-3x","fa-fw");
    	let timer = setTimeout(e => {
      	this.$telephoneIcon.classList.remove("fa","fa-circle-o-notch","fa-spin","fa-3x","fa-fw");
      	this.$telephoneIcon.classList.add("fa","fa-phone","fa-2x");
      	clearTimeout(timer);
    	}, delay);
    	window.location.href = `tel:${e.telephone}`;
		}
		else if(!e.telephone){
			this.editing = true;
			this.$telephoneInput.focus();
		}
  }

  _email(e){
		console.log(e);
		if(e.email && !this.editing){
			let delay = 3000;
			this.$emailIcon.classList.remove("fa", "fa-envelope", "fa-2x");
			this.$emailIcon.classList.add("fa","fa-circle-o-notch","fa-spin","fa-3x","fa-fw");
			let timer = setTimeout(e => {
				this.$emailIcon.classList.remove("fa","fa-circle-o-notch","fa-spin","fa-3x","fa-fw");
				this.$emailIcon.classList.add("fa", "fa-envelope", "fa-2x");
				clearTimeout(timer);
			}, delay);
			window.location.href = `mailto:${this.person.email}`;
		}
		else if (!e.email){
			this.editing = true;
			this.$emailInput.focus();
		}
	}
}

window.customElements.define('ui-contact-card', UIContactCard);
