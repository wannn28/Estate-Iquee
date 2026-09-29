-- Hollis Row schema (MySQL 8, utf8mb4)

CREATE TABLE agents (
    id         VARCHAR(40)  NOT NULL PRIMARY KEY,
    name       VARCHAR(80)  NOT NULL,
    title      VARCHAR(120) NOT NULL,
    photo      VARCHAR(60)  NOT NULL,
    phone      VARCHAR(30)  NOT NULL,
    email      VARCHAR(120) NOT NULL,
    areas      JSON         NOT NULL,
    languages  JSON         NOT NULL,
    since      SMALLINT     NOT NULL,
    sold       INT          NOT NULL,
    avg_days   INT          NOT NULL,
    bio        TEXT         NOT NULL,
    quote      VARCHAR(400) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE neighborhoods (
    slug       VARCHAR(40)  NOT NULL PRIMARY KEY,
    name       VARCHAR(80)  NOT NULL,
    photo      VARCHAR(60)  NOT NULL,
    blurb      VARCHAR(400) NOT NULL,
    median     VARCHAR(40)  NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- a neighborhood group ("Zilker & Barton Hills") covers several listing areas
CREATE TABLE neighborhood_areas (
    neighborhood_slug VARCHAR(40) NOT NULL,
    area              VARCHAR(60) NOT NULL,
    PRIMARY KEY (neighborhood_slug, area),
    KEY idx_area (area),
    CONSTRAINT fk_na_hood FOREIGN KEY (neighborhood_slug) REFERENCES neighborhoods (slug) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listings (
    id           VARCHAR(12)   NOT NULL PRIMARY KEY,
    slug         VARCHAR(80)   NOT NULL,
    title        VARCHAR(120)  NOT NULL,
    address      VARCHAR(160)  NOT NULL,
    neighborhood VARCHAR(60)   NOT NULL,
    zip          CHAR(5)       NOT NULL,
    mode         ENUM('buy','rent') NOT NULL,
    type         ENUM('House','Condo','Townhouse','Loft','Duplex') NOT NULL,
    price        INT UNSIGNED  NOT NULL,
    beds         TINYINT UNSIGNED NOT NULL,
    baths        DECIMAL(3,1)  NOT NULL,
    sqft         INT UNSIGNED  NOT NULL,
    lot_acres    DECIMAL(6,2)  NULL,
    year_built   SMALLINT      NOT NULL,
    parking      VARCHAR(60)   NOT NULL,
    hoa          INT UNSIGNED  NULL,
    lat          DECIMAL(9,6)  NOT NULL,
    lng          DECIMAL(9,6)  NOT NULL,
    agent_id     VARCHAR(40)   NOT NULL,
    tag          ENUM('New','Price cut','Open Sat','Off-market') NULL,
    days_listed  INT UNSIGNED  NOT NULL,
    featured     BOOLEAN       NOT NULL DEFAULT FALSE,
    summary      VARCHAR(400)  NOT NULL,
    description  JSON          NOT NULL,
    available    VARCHAR(40)   NULL,
    sort_order   INT           NOT NULL DEFAULT 0,
    created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_slug (slug),
    KEY idx_mode_price (mode, price),
    KEY idx_neighborhood (neighborhood),
    KEY idx_agent (agent_id),
    KEY idx_geo (lat, lng),
    CONSTRAINT fk_listing_agent FOREIGN KEY (agent_id) REFERENCES agents (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listing_photos (
    listing_id VARCHAR(12) NOT NULL,
    seq        TINYINT UNSIGNED NOT NULL,
    photo      VARCHAR(60) NOT NULL,
    PRIMARY KEY (listing_id, seq),
    CONSTRAINT fk_photo_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listing_amenities (
    listing_id VARCHAR(12) NOT NULL,
    amenity    VARCHAR(40) NOT NULL,
    seq        TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (listing_id, amenity),
    KEY idx_amenity (amenity),
    CONSTRAINT fk_amenity_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE testimonials (
    id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    quote      TEXT         NOT NULL,
    name       VARCHAR(80)  NOT NULL,
    detail     VARCHAR(120) NOT NULL,
    sort_order INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tour_requests (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    listing_id VARCHAR(12)  NOT NULL,
    tour_date  DATE         NOT NULL,
    tour_time  VARCHAR(10)  NOT NULL,
    kind       ENUM('in-person','video') NOT NULL,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(160) NOT NULL,
    phone      VARCHAR(30)  NULL,
    note       VARCHAR(1000) NULL,
    client_id  CHAR(36)     NULL,
    ip_hash    CHAR(16)     NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_tour_created (created_at),
    KEY idx_tour_listing (listing_id),
    CONSTRAINT fk_tour_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contact_messages (
    id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    topic      ENUM('buying','selling','renting','other') NOT NULL,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(160) NOT NULL,
    phone      VARCHAR(30)  NULL,
    agent_id   VARCHAR(40)  NULL,
    message    VARCHAR(4000) NOT NULL,
    client_id  CHAR(36)     NULL,
    ip_hash    CHAR(16)     NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_msg_created (created_at),
    CONSTRAINT fk_msg_agent FOREIGN KEY (agent_id) REFERENCES agents (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- shortlist keyed by an anonymous, client-generated UUID (no accounts)
CREATE TABLE saved_homes (
    client_id  CHAR(36)    NOT NULL,
    listing_id VARCHAR(12) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (client_id, listing_id),
    CONSTRAINT fk_saved_listing FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_users (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    email         VARCHAR(160) NOT NULL,
    name          VARCHAR(80)  NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
