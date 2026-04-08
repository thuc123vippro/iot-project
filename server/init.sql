CREATE DATABASE IF NOT EXISTS smart_home_db;
USE smart_home_db;

CREATE TABLE IF NOT EXISTS sensors (
    sensor_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    value FLOAT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sensor_data_sensors
        FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS devices (
    device_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    current_status ENUM('on', 'off', 'waiting') DEFAULT 'off',
    gpio_pin INT,
    mqtt_topic VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS action_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    action VARCHAR(255),
    status ENUM('on', 'off', 'waiting'),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_action_history_devices
        FOREIGN KEY (device_id) REFERENCES devices(device_id)
        ON DELETE CASCADE
);

INSERT IGNORE INTO devices (device_id, name, gpio_pin, mqtt_topic, current_status) VALUES
(1, 'Light', 5, 'iot/device/light/set', 'off'),
(2, 'Fan', 18, 'iot/device/fan/set', 'off'),
(3, 'Air Conditioner', 19, 'iot/device/air_conditioner/set', 'off');
