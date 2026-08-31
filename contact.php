<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function post_value(string $name): string
{
    $value = $_POST[$name] ?? '';

    return is_string($value) ? trim($value) : '';
}

function line_value(string $value): string
{
    return trim((string) preg_replace('/[\r\n]+/', ' ', $value));
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Method not allowed.']);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['https://lahaut-drone.fr', 'https://www.lahaut-drone.fr'];

if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
    respond(403, ['success' => false, 'message' => 'Forbidden.']);
}

if (post_value('_honey') !== '') {
    respond(200, ['success' => true]);
}

$name = line_value(post_value('name'));
$email = line_value(post_value('email'));
$telephone = line_value(post_value('telephone'));
$project = line_value(post_value('type_de_projet'));
$message = trim(post_value('message'));

if (
    $name === '' ||
    $message === '' ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    strlen($name) > 120 ||
    strlen($email) > 254 ||
    strlen($telephone) > 40 ||
    strlen($project) > 120 ||
    strlen($message) > 4000
) {
    respond(422, ['success' => false, 'message' => 'Veuillez vérifier les informations saisies.']);
}

$body = implode("\n", [
    'Nouvelle demande reçue depuis lahaut-drone.fr',
    '',
    'Nom : ' . $name,
    'E-mail : ' . $email,
    'Téléphone : ' . ($telephone !== '' ? $telephone : 'Non renseigné'),
    'Projet : ' . ($project !== '' ? $project : 'Non renseigné'),
    '',
    'Message :',
    $message,
]);

$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: La haut <contact@lahaut-drone.fr>',
    'Reply-To: ' . $email,
]);

$sent = @mail(
    'contact@lahaut-drone.fr',
    'Nouvelle demande - La haut',
    $body,
    $headers
);

if (!$sent) {
    respond(500, ['success' => false, 'message' => 'Le message n’a pas pu être envoyé.']);
}

respond(200, ['success' => true]);
