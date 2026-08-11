import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, Ticket } from "lucide-react";
import { usePageTitle } from "../../lib/usePageTitle";
import { Button, Card } from "../../components/ui";

/*
 * Where Stripe sends the patient after a successful card payment.
 *
 * Purely a confirmation screen. The appointment's payment_status is updated by
 * the checkout.session.completed webhook on the backend, so this page has no
 * work to do beyond confirming and pointing the patient onward -- it doesn't
 * fetch or second-guess the status.
 */
export default function PaymentSuccess() {
  usePageTitle("Payment successful");

  return (
    <div className="mx-auto max-w-lg px-6 py-16">
      <Card className="flex flex-col items-center p-8 text-center sm:p-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-sage-light text-sage">
          <CheckCircle2 size={30} />
        </span>

        <h1 className="mt-6 font-display text-3xl font-semibold text-ink">Payment successful</h1>
        <p className="mt-2 text-slate">
          Thanks — your appointment fee has been paid. Your token is confirmed, so just turn up
          on the day of your visit.
        </p>

        <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Link to="/my-appointments">
            <Button className="w-full justify-center sm:w-auto">
              <CalendarCheck size={16} /> View my appointments
            </Button>
          </Link>
          <Link to="/hospitals">
            <Button variant="outline" className="w-full justify-center sm:w-auto">
              <Ticket size={16} /> Book another
            </Button>
          </Link>
        </div>

        {/* Checkout is opened in a new tab, so say so rather than leaving the
            patient wondering why their other tab still reads "pending". */}
        <p className="mt-6 text-xs text-slate-light">
          Opened in a new tab? You can close it — refresh your appointments list to see the update.
        </p>
      </Card>
    </div>
  );
}
