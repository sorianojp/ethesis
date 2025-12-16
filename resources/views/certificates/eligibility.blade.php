<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>{{ $certificateTitle }}</title>
    <style>
        :root {
            font-family: "Century Gothic", Arial, sans-serif;
            color: #1f2937;
        }

        body {
            margin: 0;
        }

        /* ✅ Watermark Logo CSS */
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            opacity: 0.08;
            /* make it light */
            z-index: -1;
            /* put behind text */
            pointer-events: none;
        }

        .watermark img {
            width: 500px;
            /* adjust size */
        }

        .certificate {
            border: 2px solid #0f172a;
            padding: 36px;
        }

        .header {
            text-align: center;
            margin-bottom: 32px;
        }

        .header h1 {
            margin: 0;
            font-size: 20px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .section {
            margin-bottom: 20px;
        }

        .section h2 {
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            margin-bottom: 8px;
        }

        .section p {
            margin: 0;
            font-size: 13px;
            line-height: 1.5;
        }

        ul {
            margin: 0;
            padding-left: 18px;
            font-size: 13px;
        }

        .footer {
            margin-top: 32px;
            text-align: right;
            font-size: 11px;
            color: #475569;
        }
    </style>
</head>

<body>
    <div class="watermark">
        <img src="{{ public_path('images/logo.png') }}" alt="Watermark Logo">
    </div>
    <div class="certificate">
        <div class="header">
            <h1>{{ config('app.name', 'E-Thesis') }}</h1>
            <p style="margin: 6px 0 0; font-size: 14px; color: #475569;">
                {{ $certificateTitle }}
            </p>
        </div>

        <div class="section">
            <h2>Thesis Title</h2>
            <p>{{ $thesisTitle->title }}</p>
        </div>

        @php
            $leader = optional($thesisTitle->user)->name;
            $memberNames = $thesisTitle->members->pluck('name')->filter()->values();
            $participants = $memberNames->toArray();
            if ($leader && !in_array($leader, $participants, true)) {
                array_unshift($participants, $leader);
            }

            $formattedSchedule = $defenseSchedule
                ? $defenseSchedule->timezone(config('app.timezone'))->format('F j, Y g:i A')
                : 'To be determined';

            $panel = optional($thesisTitle->panel);
            $panelMembers = collect([
                'Chairman' => optional($panel?->chairman)->name,
                'Panel Member 1' => optional($panel?->memberOne)->name,
                'Panel Member 2' => optional($panel?->memberTwo)->name,
            ])->filter();
        @endphp

        <div class="section">
            <h2>Members</h2>
            @if (empty($participants))
                <p>No members listed.</p>
            @else
                <ul>
                    @foreach ($participants as $name)
                        <li>{{ $name }}</li>
                    @endforeach
                </ul>
            @endif
        </div>

        <div class="section">
            <h2>Adviser</h2>
            <p>{{ optional($thesisTitle->adviser)->name ?? 'Not assigned' }}</p>
        </div>

        <div class="section">
            <h2>Technical Adviser</h2>
            <p>{{ optional($thesisTitle->technicalAdviser)->name ?? 'Not assigned' }}</p>
        </div>

        <div class="section">
            <h2>Defense Schedule</h2>
            <p>{{ $formattedSchedule }}</p>
        </div>

        <div class="section">
            <h2>Panel Members</h2>
            @if ($panelMembers->isEmpty())
                <p>No panel members assigned.</p>
            @else
                <ul>
                    @foreach ($panelMembers as $role => $name)
                        <li>{{ $role }}: {{ $name }}</li>
                    @endforeach
                </ul>
            @endif
        </div>

        <div class="footer">
            Generated on {{ now()->timezone(config('app.timezone'))->format('F j, Y g:i A') }}
        </div>
    </div>
</body>

</html>
