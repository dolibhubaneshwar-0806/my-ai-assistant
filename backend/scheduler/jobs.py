"""APScheduler background jobs"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import logging

logger = logging.getLogger(__name__)
scheduler = BackgroundScheduler()


def hydration_reminder():
    logger.info(f"[{datetime.now().strftime('%H:%M')}] 💧 Hydration reminder triggered")

def morning_study_reminder():
    logger.info(f"[{datetime.now().strftime('%H:%M')}] 📚 Morning study reminder triggered")

def sleep_reminder():
    logger.info(f"[{datetime.now().strftime('%H:%M')}] 😴 Sleep reminder triggered")

def weekly_insights_update():
    logger.info(f"[{datetime.now().strftime('%H:%M')}] 🧠 Updating weekly insights...")

def start_scheduler():
    scheduler.add_job(hydration_reminder, CronTrigger(hour="*/2"), id="hydration", replace_existing=True)
    scheduler.add_job(morning_study_reminder, CronTrigger(hour=9, minute=0), id="morning_study", replace_existing=True)
    scheduler.add_job(sleep_reminder, CronTrigger(hour=22, minute=0), id="sleep", replace_existing=True)
    scheduler.add_job(weekly_insights_update, CronTrigger(day_of_week="sun", hour=8), id="weekly_insights", replace_existing=True)
    scheduler.start()
    logger.info("✅ AI LifeOS Scheduler started")

def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("🛑 Scheduler stopped")
