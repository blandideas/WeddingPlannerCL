import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  amount: z.string()
    .min(1, { message: "Budget amount is required" })
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, { message: "Budget must be a positive number" }),
});

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SetBudgetModal({ isOpen, onClose }: SetBudgetModalProps) {
  const { toast } = useToast();
  
  // Fetch current budget
  const { data: budget } = useQuery({
    queryKey: ['/api/budget'],
  });
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: budget?.amount?.toString() || "0",
    },
  });
  
  useEffect(() => {
    if (budget?.amount) {
      form.setValue('amount', budget.amount.toString());
    }
  }, [budget, form]);
  
  // Set budget mutation
  const setBudgetMutation = useMutation({
    mutationFn: async (data: { amount: number }) => {
      const response = await apiRequest('POST', '/api/budget', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/budget'] });
      toast({ title: "Success", description: "Budget updated successfully" });
      onClose();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "There was an error updating the budget", 
        variant: "destructive" 
      });
    }
  });
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    setBudgetMutation.mutate({ amount: data.amount });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Wedding Budget</DialogTitle>
          <DialogDescription>
            Set your total budget for the wedding. This will help you track your expenses.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Budget Amount</FormLabel>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-7" 
                        min="0" 
                        step="0.01" 
                        {...field} 
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={setBudgetMutation.isPending}
              >
                {setBudgetMutation.isPending ? "Saving..." : "Save Budget"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
