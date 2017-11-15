'use strict'

const uiContactCardDoc = document._currentScript || document.currentScript;
const uiContactCardTemplate = uiContactCardDoc.ownerDocument.querySelector('#ui-contact-card-view');

class UIContactCard extends HTMLElement {

  static get observedAttributes(){
    return ['person'];
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
  }

  connectedCallback() {
    //Wire views here
    this.$container = this.shadowRoot.querySelector('.container');
    this.$editButton = this.shadowRoot.querySelector('#editButton');
    this.$fullName = this.shadowRoot.querySelector('#fullName');
    this.$lastUpdated = this.shadowRoot.querySelector('#lastUpdated');
    this.$telephoneActionButton = this.shadowRoot.querySelector('#telephoneActionButton');
    this.$telephoneIcon = this.shadowRoot.querySelector('#telephoneIcon');
    this.$emailActionButton = this.shadowRoot.querySelector('#emailActionButton');
    this.$emailIcon = this.shadowRoot.querySelector('#emailIcon');
    this.$telephone = this.shadowRoot.querySelector('#telephone');
    this.$email = this.shadowRoot.querySelector('#email');
    this.$emergencyContactName = this.shadowRoot.querySelector('#emergencyContactName');
    this.$emergencyContactTelephone = this.shadowRoot.querySelector('#emergencyContactTelephone');

    //EVENTS
    this.$editButton.addEventListener('click', this.editing.bind(this))
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

		this.$emergencyContactTelephone.addEventListener('click', e => {
			if(this.person.knows.length){
				e.telephone = this.person.knows[0].telephone;
      	this.calling(e);
			}
		});

    //READY, RENDER
    this.state.connected = true;
  	this._updateRendering();
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
      default:
        console.warn(`Attribute ${attrName} is not handled, you should probably do that`);
    }
  }

  get shadowRoot(){return this._shadowRoot;}
  set shadowRoot(value){ this._shadowRoot = value}

  get person(){ return this.model.person; }
  set person(value){
    this.model.person = value;
    this._updateRendering();
    this._updateEvent();
  }

  _updateEvent(){
    this.dispatchEvent(new CustomEvent(this.defaultEventName, {detail: this.model}));
  }

  _updateRendering() {
		//Only render if we're connected, and have a model. Otherwise it's a waste
		//of time
    if(!this.state.connected || !this.person){ return; }
    this.$fullName.innerHTML = `${this.person.givenName} ${this.person.familyName}`;
    this.$lastUpdated.innerHTML = 'Statically updated';
    this.$email.innerHTML = this.person.email;
    this.$telephone.innerHTML = this.person.telephone;
		console.log(this.person.knows.length)
    if(this.person.knows.length){
			console.log(this.person.knows[0])
      let emergencyGivenName = this.person.knows[0].givenName;
      let emergencyFamilyName = this.person.knows[0].familyName;
      this.$emergencyContactName.innerHTML = `${emergencyGivenName} ${emergencyFamilyName}`
      this.$emergencyContactTelephone.innerHTML = this.person.knows[0].telephone;
    }
		this.visible = true;
  }


	get visible(){ return this.state.visible; }
	set visible(value){
		//if the state already matches, return
		let display = value;
		let hide = !display;
		var type = null;

		let fade = (e) => {
			var step = type === 'in'? 0.01 : -0.01;
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








  editing(e){ console.log('EDITING', e); }

  calling(e){
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
