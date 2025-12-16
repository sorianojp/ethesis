<?php

namespace App\Notifications;

use App\Models\ThesisTitle;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ThesisTitleCreated extends Notification
{
    use Queueable;

    public function __construct(private ThesisTitle $thesisTitle)
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
        $title = $this->thesisTitle->title ?? 'New Thesis Title';

        return (new MailMessage)
            ->subject('New Thesis Title Submitted')
            ->greeting('Hello '.$notifiable->name.',')
            ->line(sprintf('%s submitted a new thesis title: "%s".', $leaderName, $title))
            ->action('View Thesis Title', route('thesis-titles.show', $this->thesisTitle))
            ->line('Please review the submission when you have time.');
    }
}
