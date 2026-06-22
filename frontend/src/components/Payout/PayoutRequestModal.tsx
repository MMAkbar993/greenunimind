import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Wallet,
  DollarSign,
  CreditCard,
  Calendar,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PayoutMethod {
  id: string;
  type: 'bank_account' | 'debit_card' | 'paypal';
  name: string;
  details: string;
  isDefault: boolean;
  estimatedDays: number;
  fees: number;
}

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    methodId: string;
    description?: string;
  }) => void;
  availableBalance: number;
  minimumAmount: number;
  payoutMethods: PayoutMethod[];
  isLoading?: boolean;
  className?: string;
}

const PayoutRequestModal: React.FC<PayoutRequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableBalance,
  minimumAmount,
  payoutMethods,
  isLoading = false,
  className
}) => {
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState(
    payoutMethods.find(m => m.isDefault)?.id || payoutMethods[0]?.id || ''
  );
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const selectedMethod = payoutMethods.find(m => m.id === selectedMethodId);
  const requestedAmount = parseFloat(amount) || 0;
  const fees = selectedMethod ? (requestedAmount * selectedMethod.fees) : 0;
  const netAmount = requestedAmount - fees;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!amount || requestedAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (requestedAmount < minimumAmount) {
      newErrors.amount = `Minimum payout amount is ${formatCurrency(minimumAmount)}`;
    } else if (requestedAmount > availableBalance) {
      newErrors.amount = `Amount cannot exceed available balance of ${formatCurrency(availableBalance)}`;
    }

    if (!selectedMethodId) {
      newErrors.method = 'Please select a payout method';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        amount: requestedAmount,
        methodId: selectedMethodId,
        description: description.trim() || undefined,
      });
    }
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: '' }));
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank_account':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      case 'debit_card':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'paypal':
        return <Wallet className="w-5 h-5 text-purple-600" />;
      default:
        return <Wallet className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEstimatedArrival = () => {
    if (!selectedMethod) return 'Unknown';
    
    const days = selectedMethod.estimatedDays;
    const today = new Date();
    const arrivalDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    
    return arrivalDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn("max-w-2xl max-h-[90vh] overflow-y-auto", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            Request Payout
          </DialogTitle>
          <DialogDescription>
            Transfer your available earnings to your preferred payment method
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Available Balance */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Available Balance</p>
                  <p className="text-2xl font-bold text-green-800">{formatCurrency(availableBalance)}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payout Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={cn("pl-10", errors.amount && "border-red-300")}
                max={availableBalance}
                min={minimumAmount}
                step="0.01"
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((availableBalance * 0.25).toFixed(2))}
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((availableBalance * 0.5).toFixed(2))}
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((availableBalance * 0.75).toFixed(2))}
              >
                75%
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(availableBalance.toFixed(2))}
              >
                Max
              </Button>
            </div>
          </div>

          {/* Payout Method Selection */}
          <div className="space-y-3">
            <Label>Payout Method</Label>
            {payoutMethods.length > 0 ? (
              <div className="space-y-2">
                {payoutMethods.map((method) => (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors",
                      selectedMethodId === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setSelectedMethodId(method.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={selectedMethodId === method.id}
                        onChange={() => setSelectedMethodId(method.id)}
                        className="text-blue-600"
                      />
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getMethodIcon(method.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{method.name}</p>
                          {method.isDefault && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{method.details}</p>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-600">
                      <p>{method.estimatedDays} business day{method.estimatedDays !== 1 ? 's' : ''}</p>
                      {method.fees > 0 && (
                        <p className="text-xs">Fee: {(method.fees * 100).toFixed(1)}%</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No payout methods available. Please add a payment method in your account settings.
                </AlertDescription>
              </Alert>
            )}
            {errors.method && (
              <p className="text-sm text-red-600">{errors.method}</p>
            )}
          </div>

          {/* Description (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Add a note for this payout..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-gray-500">{description.length}/100 characters</p>
          </div>

          {/* Payout Summary */}
          {requestedAmount > 0 && selectedMethod && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-blue-900 mb-3">Payout Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Requested Amount:</span>
                    <span className="font-medium text-blue-900">{formatCurrency(requestedAmount)}</span>
                  </div>
                  {fees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-blue-700">Processing Fee:</span>
                      <span className="font-medium text-blue-900">-{formatCurrency(fees)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-blue-200 pt-2">
                    <span className="font-medium text-blue-700">You'll Receive:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(netAmount)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-700 mt-3">
                    <Calendar className="w-4 h-4" />
                    <span>Estimated arrival: {getEstimatedArrival()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Important Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1 text-sm">
                <p><strong>Important:</strong></p>
                <p>• Payouts are processed on business days only</p>
                <p>• Processing times may vary depending on your bank</p>
                <p>• You'll receive an email confirmation once the payout is processed</p>
                <p>• Minimum payout amount: {formatCurrency(minimumAmount)}</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading || 
                !amount || 
                requestedAmount <= 0 || 
                requestedAmount > availableBalance ||
                requestedAmount < minimumAmount ||
                !selectedMethodId
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Request Payout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PayoutRequestModal;
