import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Minus, Send } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function FeedbackDialog({ open, onClose, onSubmit }) {
    const [feedback, setFeedback] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const feedbackOptions = [
        { value: 'accurate', label: 'Accurate', icon: ThumbsUp, color: 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100' },
        { value: 'partially_accurate', label: 'Partially Accurate', icon: Minus, color: 'text-yellow-600 bg-yellow-50 border-yellow-200 hover:bg-yellow-100' },
        { value: 'inaccurate', label: 'Inaccurate', icon: ThumbsDown, color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' },
    ];

    const handleSubmit = async () => {
        if (!feedback) return;
        setIsSubmitting(true);
        await onSubmit(feedback, notes);
        setIsSubmitting(false);
        setFeedback('');
        setNotes('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>How accurate was this detection?</DialogTitle>
                    <DialogDescription>
                        Your feedback helps improve our AI model
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-3 gap-3">
                        {feedbackOptions.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => setFeedback(option.value)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                                        feedback === option.value 
                                            ? option.color + ' border-current' 
                                            : 'border-stone-200 hover:border-stone-300 bg-white'
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-6 h-6",
                                        feedback === option.value ? '' : 'text-stone-400'
                                    )} />
                                    <span className={cn(
                                        "text-sm font-medium",
                                        feedback === option.value ? '' : 'text-stone-600'
                                    )}>
                                        {option.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    <div>
                        <label className="text-sm font-medium text-stone-700 mb-2 block">
                            Additional notes (optional)
                        </label>
                        <Textarea
                            placeholder="Tell us more about the detection accuracy..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            disabled={!feedback || isSubmitting}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                        >
                            <Send className="w-4 h-4" />
                            Submit Feedback
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}