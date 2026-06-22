import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ExternalLink,
  FileText,
  MoreHorizontal,
  Receipt,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useGetTeacherTransactionsQuery } from "@/redux/features/payment/payment.api";
import TransactionDetails from "./TransactionDetails";

interface TransactionTableProps {
  teacherId: string;
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
  totalAmount: number;
  teacherEarning: number;
  platformEarning: number;
  stripeInvoiceUrl?: string;
  stripePdfUrl?: string;
  status: string;
  createdAt: string;
}

const TransactionTable = ({ teacherId }: TransactionTableProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  // We no longer need these states as we're using the TransactionDetails component

  const { data, isLoading, error } = useGetTeacherTransactionsQuery({
    teacherId,
    period: selectedPeriod,
  });

  const transactions = data?.transactions || [];

  // No longer needed as we're using the TransactionDetails component directly

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            Error loading transactions. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {selectedPeriod === "month"
                  ? "This Month"
                  : selectedPeriod === "year"
                  ? "This Year"
                  : "All Time"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedPeriod("month")}>
                This Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("year")}>
                This Year
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedPeriod("all")}>
                All Time
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">
              No transactions found for this period.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Your Earnings</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction: Transaction) => (
                  <TableRow key={transaction._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        {transaction.courseId.courseThumbnail && (
                          <img
                            src={transaction.courseId.courseThumbnail}
                            alt={transaction.courseId.title}
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <span className="truncate max-w-[150px]">
                          {transaction.courseId.title}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
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
                        <span>
                          {transaction.studentId.name.firstName}{" "}
                          {transaction.studentId.name.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(transaction.totalAmount)}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(transaction.teacherEarning)}
                    </TableCell>
                    <TableCell>
                      {formatDistanceToNow(new Date(transaction.createdAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "success"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          transaction.status === "success"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <TransactionDetails
                            transactionId={transaction._id}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                View Details
                              </DropdownMenuItem>
                            }
                          />
                          {transaction.stripeInvoiceUrl && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(
                                  transaction.stripeInvoiceUrl,
                                  "_blank"
                                )
                              }
                            >
                              <Receipt className="mr-2 h-4 w-4" />
                              View Invoice
                            </DropdownMenuItem>
                          )}
                          {transaction.stripePdfUrl && (
                            <DropdownMenuItem
                              onClick={() =>
                                window.open(transaction.stripePdfUrl, "_blank")
                              }
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Download PDF
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default TransactionTable;
