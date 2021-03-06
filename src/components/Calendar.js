import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { withFirebase } from "./Firebase";


const localizer = momentLocalizer(moment);
const DragAndDropCalendar = withDragAndDrop(Calendar)


class MyCalendar extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ...this.state,
      events: [],
      defaultView:'week'
    }
    this.onClick = this.onClick.bind(this);
    this.moveEvent = this.moveEvent.bind(this)
    this.newEvent = this.newEvent.bind(this)
  }
  
  // --------------------- Database Functions ---------------------
  getTimeSlots = onTimeSlotsChange => {

    if (!this.props.firebase) return

    const timeSlotsRef = this.props.firebase.db.ref('timeSlots');
    timeSlotsRef.on('value', snapshot => {
      const snapshotValue = snapshot.val();
      const events = Object.values(snapshotValue);
      events.map((event) => {
        event.start = new Date(event.start);
        event.end = new Date(event.end);
      });
      onTimeSlotsChange(events);
    })
    
    return () => timeSlotsRef.off('value');
  }

  createSlot = hour => {
    
    const currentUser = this.props.firebase.auth.currentUser;
    
    const slotKey = this.props.firebase.db.ref('timeSlots').push().key;
  
    const timeSlot = {
      id: slotKey,
      userId: currentUser.uid,
      allDay: hour.start === hour.end ? true : false,
      title: currentUser.displayName || "Anonymous Volunteer",
      start: hour.start.toISOString(),
      end: hour.end.toISOString()
    }
    
    return this.props.firebase.db.ref('timeSlots').update({
      [`/${slotKey}`]: timeSlot,
    })
  }
  
  updateSlot = (event, onComplete) => {
    const currentUser = this.props.firebase.auth.currentUser;
  
    const timeSlot = {
      id: event.id,
      userId: currentUser.uid, // [TODO] insert check to only allow users to change their own events
      allDay: event.start === event.end ? true : false,
      title: currentUser.displayName || "Anonymous Volunteer",
      start: event.start,
      end: event.end
    }
  
    return this.props.firebase.db.ref('timeSlots').update(
      {[`/${event.id}`]: timeSlot},
      onComplete(event)
      );
  }

  deleteSlot = (event) => {

    console.log(event,`timeSlots/${event.id}`)

    return this.props.firebase.db.ref(`timeSlots/${event.id}`).set(null);
  }

  // --------------------- Database Functions (END) ---------------------

  updateCalendarEvents = () => this.getTimeSlots(events => this.setState({ events }));

  moveEvent({ event, start, end, isAllDay: droppedOnAllDaySlot }) {
    const updatedEvent = { ...event, start, end };
    this.updateSlot(updatedEvent, (eventFromDB) => {
      this.setState({ events: this.state.events.concat([eventFromDB]) })
    });
  }

  resizeEvent = (event) => {
    console.log(event);
    this.updateSlot(event, (event) => {
      this.setState({ events: this.state.events.concat([event]) })
    });
  }

  newEvent(event) {
    let timeSlot = {
      title: 'New Volunteer Time Slot',
      allDay: event.slots.length === 1,
      start: event.start,
      end: event.end,
    };
    
    this.createSlot(timeSlot);
    this.updateCalendarEvents();
  }


  onClick(pEvent,event) {
    if(event.target.className === "rbc-trash"){
      //const r = window.confirm("Would you like to remove this event?")
      //if(r === true){
        console.log(pEvent,"onClick")
        this.deleteSlot(pEvent);
        this.updateCalendarEvents()
    //}
   }
    
  }

  componentDidUpdate(prevProps, prevState){
    const eventDiv = document.getElementsByClassName('rbc-event');

    if (this.state.events.length === 0) {
       this.updateCalendarEvents();
    }
    
    for(let elem of eventDiv){
      if(!elem.querySelector(".rbc-trash")){ //prevent duplicate icons from being added to event
      let el = document.createElement('div');
      el.innerHTML = 'X';
      el.style.left = "-11px";
      el.style.position = "relative";
      el.className = "rbc-trash"
      elem.appendChild(el)
    }
  }
  }

  render() {
    return (
      <DragAndDropCalendar
        {...this.props}
        selectable
        localizer={localizer}
        events={this.state.events}
        onEventDrop={this.moveEvent}
        resizable
        onEventResize={this.resizeEvent}
        onSelectSlot={this.newEvent} // [TODO] make it condition on user role: only health providers allowed
        onDragStart={console.log}
        defaultView={this.state.defaultView}
        defaultDate={new Date()}
        style={{ height: "80vh", padding: "20px 20px" }}
        onSelectEvent = {this.onClick}
      />
    )
  }
}

const CalendarComponent = withFirebase(MyCalendar);

export default CalendarComponent;