<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public $otp;
    /**
     * Create a new message instance.
     */
    public function __construct($otp)
    {
        $this->otp = $otp;
    }

    /**
     * Define the email envelope (subject, from, etc.)
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your OTP Code',
        );
    }

    /**
     * Define the email content (view + variables)
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.otp',   // <- path to your Blade template
            with: [
                'otp' => $this->otp,  // variable passed to the view
            ],
        );
    }

    /**
     * Attachments (optional)
     */
    public function attachments(): array
    {
        return [];
    }
}
