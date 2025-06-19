from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc, cast, Float
from datetime import datetime, timedelta
from typing import List
import json

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.generation import Generation
from app.schemas.user import UserBase
from app.models.rating import Rating

router = APIRouter()

@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Total users
    total_users = db.query(func.count(User.id)).scalar()

    # New users in the last week
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    new_users = db.query(func.count(User.id)).filter(User.created_at >= one_week_ago).scalar()

    # Total generations
    total_generations = db.query(func.count(Generation.id)).scalar()

    # Generation status counts
    status_counts = db.query(
        Generation.status,
        func.count(Generation.id).label('count')
    ).group_by(Generation.status).all()

    # Calculate success rate
    success_count = next((count for status, count in status_counts if status == 'success'), 0)
    success_rate = (success_count / total_generations * 100) if total_generations > 0 else 0

    # Pending generations
    pending_count = next((count for status, count in status_counts if status == 'pending'), 0)

    # Top 3 error messages
    top_errors = db.query(
        Generation.error_message,
        func.count(Generation.id).label('count')
    ).filter(
        Generation.status == 'failed',
        Generation.error_message.isnot(None)
    ).group_by(Generation.error_message).order_by(desc('count')).limit(3).all()

    # Generations by day (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    generations_by_day = db.query(
        func.date(Generation.created_at).label('date'),
        func.count(Generation.id).label('count')
    ).filter(
        Generation.created_at >= thirty_days_ago
    ).group_by(func.date(Generation.created_at)).order_by(func.date(Generation.created_at)).all()

    # Top users by generation count
    top_users = db.query(
        User.id,
        User.email,
        User.first_name,
        User.last_name,
        func.count(Generation.id).label('count')
    ).join(Generation).group_by(User.id).order_by(desc('count')).limit(10).all()

    # Latest generations
    latest_generations = db.query(
        Generation.id,
        Generation.prompt,
        Generation.status,
        Generation.created_at,
        User.email,
        User.first_name,
        User.last_name
    ).join(User).order_by(Generation.created_at.desc()).limit(10).all()

    # Latest users
    latest_users = db.query(
        User.id,
        User.email,
        User.first_name,
        User.last_name,
        User.created_at,
        User.is_active
    ).order_by(User.created_at.desc()).limit(10).all()

    # Login methods distribution
    login_methods = db.query(
        case(
            (User.google_id.is_(None), 'Email/Password'),
            else_='Google OAuth'
        ).label('method'),
        func.count(User.id).label('count')
    ).group_by('method').all()

    # --- MÉTRICAS DE RATING Y FEEDBACK ---
    # Promedio global de rating
    avg_rating = db.query(func.avg(cast(Rating.rating, Float))).scalar() or 0

    # Distribución de ratings (cuántos de cada valor 1-5)
    rating_distribution = db.query(Rating.rating, func.count(Rating.id)).group_by(Rating.rating).all()
    rating_distribution_dict = {str(r): c for r, c in rating_distribution}

    # Feedbacks más frecuentes (extraer textos de selected_criticisms)
    feedback_counts = {}
    feedback_texts = []
    feedbacks = db.query(Rating.feedback).filter(Rating.feedback.isnot(None)).all()
    for (fb,) in feedbacks:
        if not fb:
            continue
        if isinstance(fb, str):
            try:
                fb = json.loads(fb)
            except Exception:
                continue
        if isinstance(fb, dict):
            # Si hay críticas seleccionadas, contarlas por texto
            if "selected_criticisms" in fb and isinstance(fb["selected_criticisms"], list):
                for crit in fb["selected_criticisms"]:
                    if crit:
                        feedback_counts[crit] = feedback_counts.get(crit, 0) + 1
            # Si hay texto libre, agregarlo a la lista de textos
            if fb.get("text"):
                feedback_texts.append(fb["text"])
        elif isinstance(fb, list):
            for item in fb:
                if isinstance(item, str):
                    feedback_counts[item] = feedback_counts.get(item, 0) + 1

    # Top 5 feedbacks estructurados (por texto real)
    top_feedbacks = sorted(feedback_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    # Últimos 5 feedbacks escritos o seleccionados
    latest_feedbacks = db.query(Rating.feedback, Rating.rating, Rating.id).filter(Rating.feedback.isnot(None)).order_by(Rating.id.desc()).limit(5).all()
    latest_feedbacks_list = []
    for fb, rating, rid in latest_feedbacks:
        text = None
        if fb:
            if isinstance(fb, str):
                try:
                    fb = json.loads(fb)
                except Exception:
                    fb = None
            if isinstance(fb, dict):
                # Prioridad: texto libre, si no, mostrar la primera crítica seleccionada
                if fb.get("text"):
                    text = fb["text"]
                elif fb.get("selected_criticisms") and isinstance(fb["selected_criticisms"], list) and fb["selected_criticisms"]:
                    text = fb["selected_criticisms"][0]
        if text:
            latest_feedbacks_list.append({"id": rid, "rating": rating, "text": text})

    # Porcentaje de planos calificados
    total_generations = db.query(func.count(Generation.id)).scalar() or 1
    rated_generations = db.query(func.count(func.distinct(Rating.generation_id))).scalar() or 0
    percent_rated = round((rated_generations / total_generations) * 100, 2) if total_generations else 0

    return {
        "total_users": total_users,
        "new_users_week": new_users,
        "total_generations": total_generations,
        "success_rate": round(success_rate, 2),
        "pending_generations": pending_count,
        "top_errors": [
            {"message": error, "count": count}
            for error, count in top_errors
        ],
        "generations_by_day": [
            {"date": str(date), "count": count}
            for date, count in generations_by_day
        ],
        "top_users": [
            {
                "id": user_id,
                "email": email,
                "name": f"{first_name or ''} {last_name or ''}".strip() or email,
                "count": count
            }
            for user_id, email, first_name, last_name, count in top_users
        ],
        "latest_generations": [
            {
                "id": id,
                "prompt": prompt,
                "status": status,
                "created_at": created_at,
                "user": {
                    "email": email,
                    "name": f"{first_name or ''} {last_name or ''}".strip() or email
                }
            }
            for id, prompt, status, created_at, email, first_name, last_name in latest_generations
        ],
        "latest_users": [
            {
                "id": id,
                "email": email,
                "name": f"{first_name or ''} {last_name or ''}".strip() or email,
                "created_at": created_at,
                "is_active": is_active
            }
            for id, email, first_name, last_name, created_at, is_active in latest_users
        ],
        "login_methods": [
            {"method": method, "count": count}
            for method, count in login_methods
        ],
        "avg_rating": round(avg_rating, 2),
        "rating_distribution": rating_distribution_dict,
        "top_feedbacks": [{"feedback": k, "count": v} for k, v in top_feedbacks],
        "latest_feedbacks": latest_feedbacks_list,
        "percent_rated": percent_rated
    } 