<?php

namespace App\Notifications;

use App\Models\Thesis;
use App\Models\ThesisTitle;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ThesisUploaded extends Notification
{
    use Queueable;

    public function __construct(private ThesisTitle $thesisTitle, private Thesis $thesis)
    {
        //
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $leaderName = optional($this->thesisTitle->user)->name ?? 'A student';
        $chapter = $this->thesis->chapter ?? 'A chapter';
        $title = $this->thesisTitle->title ?? 'Thesis';

        return (new MailMessage)
            ->subject('New Thesis Chapter Submitted')
            ->greeting('Hello '.$notifiable->name.',')
            ->line(sprintf('%s uploaded %s for "%s".', $leaderName, $chapter, $title))
            ->action('Review Submission', route('thesis-titles.show', $this->thesisTitle))
            ->line('Please review the new upload when possible.');
    }
}
