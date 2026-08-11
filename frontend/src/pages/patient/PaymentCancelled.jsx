import { Link } from "react-router-dom";
import { CalendarCheck, CircleSlash, Info } from "lucide-react";
import { usePageTitle } from "../../lib/usePageTitle";
import { Button, Card, Alert } from "../../components/ui";

/*
 * Where Stripe sends the patient if they back out of checkout.
 *
 * Nothing was charged and -- importantly -- nothing was cancelled on our side
 * either: the appointment is still booked, still holding its token, just with
 * payment_status "pending". The copy says exactly that, because "Payment
 * cancelled" on its own reads like the appointment is gone.
 */
export default function PaymentCancelled() {
  usePageTitle("Payment cancelled");

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <Card className="flex flex-col items-center p-8 text-center sm:p-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-marigold-light text-marigold-dark">
          <CircleSlash size={28} />
        </span>

        <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Payment cancelled</h1>
        <p className="mt-2 text-slate">
          You weren't charged. Nothing else changed — your appointment is still booked.
        </p>

        <div className="mt-6 w-full text-left">
          <Alert tone="teal" icon={<Info size={15} />}>
            Your token is still reserved. It stays marked unpaid until you pay online, or you can
            settle the fee at the clinic — use <strong>Pay now</strong> from your appointments list
            to try again.
          </Alert>
        </div>

        <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/my-appointments">
            <Button className="w-full justify-center sm:w-auto">
              <CalendarCheck size={16} /> Back to my appointments
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="w-full justify-center sm:w-auto">
              Go to homepage
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
