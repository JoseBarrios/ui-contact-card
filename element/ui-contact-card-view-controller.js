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

    this.defaultEventName = 'update';
    this.state.connected = false;
    this.state.editing = false;
  }

  connectedCallback() {
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


    //EVENTS
    this.$editButton.addEventListener('click', this.edit.bind(this))
    this.$deleteButton.addEventListener('click', this.delete.bind(this))
    this.$doneButton.addEventListener('click', this.done.bind(this))
    this.$emailActionButton.addEventListener('click', this.emailing.bind(this))
    this.$email.addEventListener('click', this.emailing.bind(this));

    this.$telephoneActionButton.addEventListener('click', e => {
			e.telephone = this.person.telephone;
      this.calling(e);
    });

		this.$telephone.addEventListener('click', e => {
			e.telephone = this.person.telephone;
      this.calling(e);
		});

		this.$emergencyTelephone.addEventListener('click', e => {
			if(this.person.knows.length){
				e.telephone = this.person.knows[0].telephone;
      	this.calling(e);
			}
		});

    //READY, RENDER
    this.state.connected = true;
		this._initialRender();
		this.visible = true;
  }

  adoptedCallback(){
    //console.log('adoptedCallback');
  }

  disconnectedCallback() {
    this.state.connected = false;
    console.log('disconnected');
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

  get shadowRoot(){return this._shadowRoot;}
  set shadowRoot(value){ this._shadowRoot = value}

  get connected(){ return this.state.connected; }
  set connected(value){ this.state.connected = value; }

  get person(){ return this.model.person || {}; }
  set person(value){
    this.model.person = value;
    this._updateEvent();
		this._populateViewFields();
  }

	get editing(){ return this.state.editing; }
	set editing(value){
		console.log('editing', value)
	  this.state.editing = value;
		this._renderEditor(this.state.editing);
		this._renderViewer(!this.state.editing);
		this._populateEditorFields();
    this._updateEvent('edit');
	}

	_initialRender(){
		this._renderEditor(false);
		this._renderViewer(true);
		this._populateViewFields();
	}

	_populateViewFields(){
		//CONTACT
		if(this.person.givenName || this.person.familyName){
			this.$fullName.innerHTML = `${this.person.givenName || ''} ${this.person.familyName || ''}`;
		} else { this.$fullName.innerHTML = "New Contact"; }
		this.$lastUpdated.innerHTML = 'Statically updated';
		this.$email.innerHTML = this.person.email || 'add email';
		this.$telephone.innerHTML = this.person.telephone || 'add number';

		//EMERGENCY CONTACT
		if(this.hasEmergencyContact){
			this.$addEmergencyContactButton.classList.add('hide-view');
			this.$addEmergencyContactButton.classList.remove('show-view');
			let name = `${this.emergencyContact.givenName || ''} ${this.emergencyContact.familyName || ''}`;
			this.$emergencyFullName.innerHTML = name;
			if(this.emergencyContact.telephone){
				this.$emergencyTelephone.innerHTML = this.emergencyContact.telephone;
			} else{
				let hasName = this.emergencyContact.givenName || this.emergencyContact.fullName;
				this.$emergencyTelephone.innerHTML = hasName? 'add number' : 'add contact';
				this.$emergencyTelephone.style.color = '#1c7ef8';
			}
		} else {
			//No emergency contact, add one
			this.$addEmergencyContactButton.classList.add('show-view');
			this.$addEmergencyContactButton.classList.remove('hide-view');
		}


	}

	_renderEditor(show){
		console.log('renderEditor', show)
		//If show is true, add class is show-view
		let addClass = show? 'show-view' : 'hide-view';
		//If show is false, add class is hide-view
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

	get hasEmergencyContact(){
		return (this.person.knows && this.person.knows.length);
	}
	get emergencyContact(){
		let hasEmergencyContact = this.person.knows && this.person.knows.length;
		return hasEmergencyContact? this.person.knows[0] : {};
	}

	_renderViewer(show){
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

  _updateEvent(event=this.defaultEventName){
		let data = {};
		data.model = this.model;
		data.state = this.state;
    this.dispatchEvent(new CustomEvent(event, {detail: data}));
  }

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

	delete(e){
		console.log('DELETE')
		this.visible = false;
	}

	done(e){
		this.editing = false;
	}

	edit(e){
		console.log('EDIT', e)
		this.editing = true;
	}

  calling(e){
		if(this.editing) return;
    let delay = 1500;
    this.$telephoneIcon.classList.remove("fa","fa-phone","fa-2x");
    this.$telephoneIcon.classList.add("fa","fa-circle-o-notch","fa-spin","fa-3x","fa-fw");
    let timer = setTimeout(e => {
      this.$telephoneIcon.classList.remove("fa","fa-circle-o-notch","fa-spin","fa-3x","fa-fw");
      this.$telephoneIcon.classList.add("fa","fa-phone","fa-2x");
      clearTimeout(timer);
    }, delay);
    window.location.href = `tel:${e.telephone}`;
  }

  emailing(e){
		if(this.editing) return;
		console.log('IGNORING', this.editing)
    let delay = 1000;
    this.$emailIcon.classList.remove("fa", "fa-envelope", "fa-2x");
    this.$emailIcon.classList.add("fa","fa-circle-o-notch","fa-spin","fa-3x","fa-fw");
    let timer = setTimeout(e => {
      this.$emailIcon.classList.remove("fa","fa-circle-o-notch","fa-spin","fa-3x","fa-fw");
      this.$emailIcon.classList.add("fa", "fa-envelope", "fa-2x");
      clearTimeout(timer);
    }, delay);
    window.location.href = `mailto:${this.person.email}`;
  }
}

window.customElements.define('ui-contact-card', UIContactCard);
