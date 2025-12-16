<?php

namespace App\Notifications;

use App\Enums\ThesisStatus;
use App\Models\Thesis;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ThesisStatusUpdated extends Notification
{
    use Queueable;

    public function __construct(private Thesis $thesis, private ThesisStatus $status)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $title = optional($this->thesis->thesisTitle)->title ?? 'Your thesis';
        $chapter = $this->thesis->chapter ?? 'Submission';
        $statusLabel = match ($this->status) {
            ThesisStatus::APPROVED => 'approved',
            ThesisStatus::REJECTED => 'rejected',
            default => 'updated',
        };

        $message = match ($this->status) {
            ThesisStatus::APPROVED => 'has been approved.',
            ThesisStatus::REJECTED => 'has been rejected. Please review the remarks in the portal.',
            default => 'has been updated.',
        };

        return (new MailMessage)
            ->subject('Thesis Review Update')
            ->greeting('Hello '.$notifiable->name.',')
            ->line(sprintf('Your %s for "%s" %s', $chapter, $title, $message))
            ->action('View Details', route('thesis-titles.show', $this->thesis->thesisTitle))
            ->line('Thank you for your submission.');
    }
}
