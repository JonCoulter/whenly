from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from datetime import datetime
import json

db = SQLAlchemy()
migrate = Migrate()

def init_app(app):
    db.init_app(app)
    migrate.init_app(app, db)
    
    @app.before_first_request
    def create_tables():
        """Create database tables before first request"""
        db.create_all()

class Event(db.Model):
    """
    Event model representing a scheduling event
    """
    __tablename__ = 'events'
    
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)  # 'specificDays' or 'daysOfWeek'
    time_start = db.Column(db.String(20), nullable=False)  # Format: 'HH:MM AM/PM'
    time_end = db.Column(db.String(20), nullable=False)    # Format: 'HH:MM AM/PM'
    specific_days = db.Column(db.Text)  # JSON string of dates ['YYYY-MM-DD', ...]
    days_of_week = db.Column(db.Text)   # JSON string of days ['Monday', 'Wednesday', ...]
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(255))  # User email of creator
    creator_name = db.Column(db.String(255))  # Name of the creator
    
    # Relationships
    availability_slots = db.relationship('AvailabilitySlot', backref='event', lazy=True, cascade="all, delete-orphan")
    responses = db.relationship('Response', backref='event', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'eventType': self.event_type,
            'timeRange': {
                'start': self.time_start,
                'end': self.time_end
            },
            'specificDays': json.loads(self.specific_days or '[]'),
            'daysOfWeek': json.loads(self.days_of_week or '[]'),
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'createdBy': self.created_by,
            'creatorName': self.creator_name
        }


class AvailabilitySlot(db.Model):
    """
    Represents a single time slot for availability in an event
    """
    __tablename__ = 'availability_slots'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    date = db.Column(db.Date, nullable=True)  # For specificDays events
    day_of_week = db.Column(db.String(20), nullable=True)  # For daysOfWeek events
    start_time = db.Column(db.String(20), nullable=False)  # Format: 'HH:MM AM/PM'
    end_time = db.Column(db.String(20), nullable=False)    # Format: 'HH:MM AM/PM'
    
    # Relationships
    responses = db.relationship('Response', backref='slot', lazy=True)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'eventId': self.event_id,
            'date': self.date.isoformat() if self.date else None,
            'dayOfWeek': self.day_of_week,
            'startTime': self.start_time,
            'endTime': self.end_time
        }


class Response(db.Model):
    """
    Represents a user's response for an event's availability
    """
    __tablename__ = 'responses'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.String(36), db.ForeignKey('events.id'), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey('availability_slots.id'), nullable=False)
    user_id = db.Column(db.String(255), nullable=True)  # User ID or email (optional for anonymous responses)
    user_name = db.Column(db.String(255), nullable=False)  # Name provided by the user
    is_available = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            'eventId': self.event_id,
            'slotId': self.slot_id,
            'userId': self.user_id,
            'userName': self.user_name,
            'isAvailable': self.is_available,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        } 