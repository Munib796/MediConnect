import stripe

from src.utils.settings import settings

stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(appointment_id: int, fee: int, success_url: str, cancel_url: str) -> str:
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {
                    "name": f"MediConnect Appointment #{appointment_id}",
                },
                "unit_amount": fee * 100,
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"appointment_id": str(appointment_id)},
    )
    return session.id, session.url