from database.db import db
from datetime import datetime
import json


# ─────────────────────────────────────────────
# USER
# ─────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"

    id            = db.Column(db.Integer, primary_key=True)
    name          = db.Column(db.String(120), nullable=False)
    email         = db.Column(db.String(200), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role          = db.Column(db.String(20), nullable=False, default="patient")
    is_active     = db.Column(db.Boolean, default=True)
    created_at    = db.Column(db.DateTime, default=datetime.utcnow)

    demographics    = db.relationship("Demographic",         backref="user", uselist=False)
    sessions        = db.relationship("Session",             backref="user", lazy="dynamic")
    cognitive_tests = db.relationship("CognitiveAssessment", backref="user", lazy="dynamic")
    mri_scans       = db.relationship("MRIScan",             backref="user", lazy="dynamic")
    reports         = db.relationship("Report",              backref="user", lazy="dynamic")
    recommendations = db.relationship("Recommendation",      backref="user", lazy="dynamic")
    notifications   = db.relationship("Notification",        backref="user", lazy="dynamic")

    def to_dict(self):
        return {
            "id":         self.id,
            "name":       self.name,
            "email":      self.email,
            "role":       self.role,
            "is_active":  self.is_active,
            "created_at": self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────
# DEMOGRAPHIC
# ─────────────────────────────────────────────
class Demographic(db.Model):
    __tablename__ = "demographics"

    id                 = db.Column(db.Integer, primary_key=True)
    user_id            = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    age                = db.Column(db.Integer, nullable=False)
    gender             = db.Column(db.String(10), nullable=False)
    family_history     = db.Column(db.Boolean, default=False)
    education_level    = db.Column(db.String(50))
    smoking            = db.Column(db.Boolean, default=False)
    physical_activity  = db.Column(db.String(20))
    sleep_quality      = db.Column(db.String(20))
    hypertension       = db.Column(db.Boolean, default=False)
    diabetes           = db.Column(db.Boolean, default=False)
    depression_history = db.Column(db.Boolean, default=False)
    head_injury        = db.Column(db.Boolean, default=False)
    hearing_loss       = db.Column(db.Boolean, default=False)
    social_isolation   = db.Column(db.Boolean, default=False)
    created_at         = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at         = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id":                 self.id,
            "user_id":            self.user_id,
            "age":                self.age,
            "gender":             self.gender,
            "family_history":     self.family_history,
            "education_level":    self.education_level,
            "smoking":            self.smoking,
            "physical_activity":  self.physical_activity,
            "sleep_quality":      self.sleep_quality,
            "hypertension":       self.hypertension,
            "diabetes":           self.diabetes,
            "depression_history": self.depression_history or False,
            "head_injury":        self.head_injury        or False,
            "hearing_loss":       self.hearing_loss       or False,
            "social_isolation":   self.social_isolation   or False,
        }


# ─────────────────────────────────────────────
# SESSION
# ─────────────────────────────────────────────
class Session(db.Model):
    __tablename__ = "sessions"

    id                  = db.Column(db.Integer, primary_key=True)
    user_id             = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    final_ad_percentage = db.Column(db.Float)
    stage_label         = db.Column(db.String(50))
    is_complete         = db.Column(db.Boolean, default=False)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)

    cognitive_assessment = db.relationship("CognitiveAssessment", backref="session", uselist=False)
    mri_scan             = db.relationship("MRIScan",             backref="session", uselist=False)
    report               = db.relationship("Report",              backref="session", uselist=False)
    recommendation       = db.relationship("Recommendation",      backref="session", uselist=False)
    progression          = db.relationship(
        "ProgressionRecord", backref="session",
        foreign_keys="ProgressionRecord.session_id_current", uselist=False
    )

    def to_dict(self):
        return {
            "id":                   self.id,
            "user_id":              self.user_id,
            "final_ad_percentage":  self.final_ad_percentage,
            "stage_label":          self.stage_label,
            "is_complete":          self.is_complete,
            "created_at":           self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────
# COGNITIVE ASSESSMENT
# ─────────────────────────────────────────────
class CognitiveAssessment(db.Model):
    __tablename__ = "cognitive_assessments"

    id               = db.Column(db.Integer, primary_key=True)
    user_id          = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_id       = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    raw_score        = db.Column(db.Float, nullable=False)
    normalized_score = db.Column(db.Float, nullable=False)
    answers_json     = db.Column(db.Text)
    created_at       = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":               self.id,
            "user_id":          self.user_id,
            "session_id":       self.session_id,
            "raw_score":        self.raw_score,
            "normalized_score": self.normalized_score,
            "answers":          json.loads(self.answers_json) if self.answers_json else [],
            "created_at":       self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────
# MRI SCAN
# ─────────────────────────────────────────────
class MRIScan(db.Model):
    __tablename__ = "mri_scans"

    id                   = db.Column(db.Integer, primary_key=True)
    user_id              = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_id           = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    file_path            = db.Column(db.String(500))
    vgg16_prediction     = db.Column(db.String(50))
    vgg16_confidence     = db.Column(db.Float)
    resnet50_prediction  = db.Column(db.String(50))
    resnet50_confidence  = db.Column(db.Float)
    ensemble_stage       = db.Column(db.String(50))
    ensemble_confidence  = db.Column(db.Float)
    mri_risk_score       = db.Column(db.Float)
    created_at           = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":                  self.id,
            "session_id":          self.session_id,
            "user_id":             self.user_id,
            "vgg16_prediction":    self.vgg16_prediction,
            "vgg16_confidence":    self.vgg16_confidence,
            "resnet50_prediction": self.resnet50_prediction,
            "resnet50_confidence": self.resnet50_confidence,
            "ensemble_stage":      self.ensemble_stage,
            "ensemble_confidence": self.ensemble_confidence,
            "mri_risk_score":      self.mri_risk_score,
            "created_at":          self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────
# PROGRESSION RECORD
# ─────────────────────────────────────────────
class ProgressionRecord(db.Model):
    __tablename__ = "progression_records"

    id                  = db.Column(db.Integer, primary_key=True)
    user_id             = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_id_current  = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    session_id_previous = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=True)
    delta_ad_percentage = db.Column(db.Float)
    delta_cognitive     = db.Column(db.Float)
    progression_label   = db.Column(db.String(20))
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":                  self.id,
            "user_id":             self.user_id,
            "session_id_current":  self.session_id_current,
            "session_id_previous": self.session_id_previous,
            "delta_ad_percentage": self.delta_ad_percentage,
            "delta_cognitive":     self.delta_cognitive,
            "progression_label":   self.progression_label,
            "created_at":          self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────
# REPORT
# ─────────────────────────────────────────────
class Report(db.Model):
    __tablename__ = "reports"

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_id   = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    pdf_path     = db.Column(db.String(500))
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":           self.id,
            "user_id":      self.user_id,
            "session_id":   self.session_id,
            "pdf_path":     self.pdf_path,
            "generated_at": self.generated_at.isoformat(),
        }


# ─────────────────────────────────────────────
# RECOMMENDATION
# ─────────────────────────────────────────────
class Recommendation(db.Model):
    __tablename__ = "recommendations"

    id                  = db.Column(db.Integer, primary_key=True)
    user_id             = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    session_id          = db.Column(db.Integer, db.ForeignKey("sessions.id"), nullable=False)
    stage               = db.Column(db.String(50))
    recommendation_json = db.Column(db.Text)
    created_at          = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":              self.id,
            "user_id":         self.user_id,
            "session_id":      self.session_id,
            "stage":           self.stage,
            "recommendations": json.loads(self.recommendation_json) if self.recommendation_json else [],
            "created_at":      self.created_at.isoformat(),
        }


# ─────────────────────────────────────────────
# MODEL CONFIG
# ─────────────────────────────────────────────
class ModelConfig(db.Model):
    __tablename__ = "model_config"

    id                 = db.Column(db.Integer, primary_key=True)
    weight_demographic = db.Column(db.Float, default=0.20)
    weight_cognitive   = db.Column(db.Float, default=0.35)
    weight_mri         = db.Column(db.Float, default=0.45)
    active_model       = db.Column(db.String(20), default="ensemble")
    mild_threshold     = db.Column(db.Float, default=51.0)
    moderate_threshold = db.Column(db.Float, default=76.0)
    updated_at         = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by         = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    def to_dict(self):
        return {
            "weight_demographic": self.weight_demographic,
            "weight_cognitive":   self.weight_cognitive,
            "weight_mri":         self.weight_mri,
            "active_model":       self.active_model,
            "mild_threshold":     self.mild_threshold,
            "moderate_threshold": self.moderate_threshold,
        }


# ─────────────────────────────────────────────
# NOTIFICATION
# ─────────────────────────────────────────────
class Notification(db.Model):
    __tablename__ = "notifications"

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title      = db.Column(db.String(200), nullable=False)
    message    = db.Column(db.Text, nullable=False)
    notif_type = db.Column(db.String(30), default="info")
    is_read    = db.Column(db.Boolean, default=False)
    link       = db.Column(db.String(300))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id":         self.id,
            "user_id":    self.user_id,
            "title":      self.title,
            "message":    self.message,
            "type":       self.notif_type,
            "is_read":    self.is_read,
            "link":       self.link,
            "created_at": self.created_at.isoformat(),
        }
