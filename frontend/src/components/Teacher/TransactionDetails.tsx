import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, FileText, Info, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useGetTransactionByIdQuery } from "@/redux/features/payment/payment.api";

interface TransactionDetailsProps {
  transactionId: string;
  trigger?: React.ReactNode;
}

interface Transaction {
  _id: string;
  courseId: {
    _id: string;
    title: string;
    courseThumbnail: string;
  };
  studentId: {
    _id: string;
    name: {
      firstName: string;
      lastName: string;
    };
    email: string;
    profileImg: string;
  };
  teacherId: {
    _id: string;
    name: {
      firstName: string;
      lastName: string;
    };
    email: string;
    profileImg: string;
  };
  totalAmount: number;
  teacherEarning: number;
  platformEarning: number;
  stripeInvoiceUrl?: string;
  stripePdfUrl?: string;
  stripeTransactionId: string;
  stripeTransferStatus: string;
  stripeTransferId?: string;
  status: string;
  createdAt: string;
}

const TransactionDetails = ({ transactionId, trigger }: TransactionDetailsProps) => {
  const [open, setOpen] = useState(false);

  const { data, isLoading, error } = useGetTransactionByIdQuery(transactionId, {
    skip: !open || !transactionId,
  });

  const transaction = data?.data as Transaction | undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Info className="h-4 w-4" />
            <span className="sr-only">View Details</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>
            Complete information about this transaction
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-red-500">
            Failed to load transaction details. Please try again.
          </div>
        ) : transaction ? (
          <div className="space-y-4">
            {/* Transaction ID and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Transaction ID</h4>
                <p className="text-sm font-mono">{transaction._id.substring(0, 10)}...</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">Date</h4>
                <p className="text-sm">{formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}</p>
                <p className="text-xs text-muted-foreground">{formatDate(transaction.createdAt)}</p>
              </div>
            </div>

            {/* Course Information */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Course</h4>
              <div className="flex items-center space-x-2">
                {transaction.courseId.courseThumbnail && (
                  <img
                    src={transaction.courseId.courseThumbnail}
                    alt={transaction.courseId.title}
                    className="h-10 w-10 rounded object-cover"
                  />
                )}
                <div>
                  <p className="text-sm font-medium">{transaction.courseId.title}</p>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Student</h4>
              <div className="flex items-center space-x-2">
                {transaction.studentId.profileImg ? (
                  <img
                    src={transaction.studentId.profileImg}
                    alt={`${transaction.studentId.name.firstName} ${transaction.studentId.name.lastName}`}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 rounded-full bg-muted p-1" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {transaction.studentId.name.firstName} {transaction.studentId.name.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{transaction.studentId.email}</p>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Financial Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Total Amount</p>
                  <p className="text-sm font-medium">{formatCurrency(transaction.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your Earnings</p>
                  <p className="text-sm font-medium text-green-600">{formatCurrency(transaction.teacherEarning)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Platform Fee</p>
                  <p className="text-sm">{formatCurrency(transaction.platformEarning)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge
                    variant={transaction.status === 'success' ? 'default' : 'destructive'}
                    className={`mt-1 ${transaction.status === 'success' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}`}
                  >
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Stripe Details */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Stripe Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Transaction ID</p>
                  <p className="text-sm font-mono">{transaction.stripeTransactionId.substring(0, 10)}...</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transfer Status</p>
                  <Badge
                    variant={
                      transaction.stripeTransferStatus === 'completed'
                        ? 'default'
                        : transaction.stripeTransferStatus === 'pending'
                        ? 'outline'
                        : 'destructive'
                    }
                    className={`mt-1 ${
                      transaction.stripeTransferStatus === 'completed'
                        ? 'bg-green-100 text-green-800 hover:bg-green-100'
                        : ''
                    }`}
                  >
                    {transaction.stripeTransferStatus}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Invoice Links */}
            {(transaction.stripeInvoiceUrl || transaction.stripePdfUrl) && (
              <div className="flex justify-end space-x-2 pt-4">
                {transaction.stripeInvoiceUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(transaction.stripeInvoiceUrl, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Invoice
                  </Button>
                )}
                {transaction.stripePdfUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(transaction.stripePdfUrl, '_blank')}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Download PDF
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No transaction details found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetails;
