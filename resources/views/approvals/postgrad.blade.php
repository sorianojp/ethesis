<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <title>Approval Form (Postgraduate)</title>
    <style>
        @page {
            size: A4;
            margin: 1.5in 1in 1in 1.5in;
        }

        body {
            font-family: "Times New Roman", Times, serif;
            margin: 0;
            font-size: 11pt;
            line-height: 1.7;
        }

        .title {
            text-align: center;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 28px;
        }

        .indent {
            text-indent: 48px;
            text-align: justify;
            margin-bottom: 24px;
        }

        .adviser-block {
            margin-top: 32px;
            text-align: right;
        }

        .center-block {
            text-align: center;
            margin-top: 48px;
        }

        .center-block .name {
            font-weight: bold;
            text-transform: uppercase;
        }

        .highlight {
            text-align: center;
            text-transform: uppercase;
            font-weight: bold;
            margin-top: 32px;
        }

        .dean {
            margin-top: 52px;
            text-align: right;
        }

        .signature-block {
            display: inline-block;
            text-align: center;
        }

        .signature-block .name {
            font-weight: bold;
            text-transform: uppercase;
        }

        .closing {
            margin-top: 32px;
        }
    </style>
</head>

<body>
    <div class="title">Approval Sheet</div>

    <p class="indent">
        In partial fulfillment of the requirements leading to the degree of {{ $courseName }}, the completed
        project study entitled, <span style="font-weight: bold">“{{ $thesisTitle }}”</span>, prepared and submitted by
        <span style="font-weight: bold; text-transform: uppercase;">{{ $studentName }}</span>, is endorsed for
        approval and acceptance.
    </p>

    <div class="adviser-block">
        <div class="signature-block">
            <div class="name">{{ $adviserName }}</div>
            <div>Adviser</div>
        </div>
        <div class="signature-block" style="margin-left: 32px;">
            <div class="name">{{ $technicalAdviserName }}</div>
            <div>Technical Adviser</div>
        </div>
    </div>

    <p class="indent">
        This is to certify that the completed project study mentioned above submitted by
        <span style="font-weight: bold; text-transform: uppercase;">{{ $studentName }}</span> has been examined
        and approved on <span style="font-weight: bold; text-transform: uppercase;">{{ $finalDefenseDate }}</span> by
        the Oral Examination Committee.
    </p>

    <div class="center-block">
        <div class="name">{{ $chairmanName }}</div>
        <div>Chairman</div>
    </div>

    <table style="width: 100%; margin-top: 32px;">
        <tr>
            <td style="text-align: center; width: 50%;">
                <div style="font-weight: bold;">{{ $memberOneName }}</div>
                <div>Member</div>
            </td>
            <td style="text-align: center; width: 50%;">
                <div style="font-weight: bold;">{{ $memberTwoName }}</div>
                <div>Member</div>
            </td>
        </tr>
    </table>

    <p class="indent closing">
        Accepted and approved as partial fulfillment of the requirements for the degree of
        {{ $courseName }} on
        <span style="font-weight: bold; text-transform: uppercase;">{{ $finalDefenseDate }}</span>, with
        a grade of <span style="font-weight: bold;">_________________________</span>.
    </p>

    <p class="indent closing">Comprehensive Examination: <span style="font-weight: bold;">PASSED</span></p>

    <div class="dean">
        <div class="signature-block">
            <div class="name">CARIDAD OLI ABUAN, Ed.D.</div>
            <div>Dean, School of Professional Studies</div>
        </div>
    </div>
</body>

</html>
